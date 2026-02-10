"""
Agent Resources - Control Plane API
FastAPI service for managing agent lifecycle, policies, and evaluations.
"""

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from contextlib import asynccontextmanager
import jwt
from typing import Optional, Dict, Any, List
import uuid
from pydantic import BaseModel
from datetime import datetime

# ============================================================================
# DATABASE SETUP
# ============================================================================

DATABASE_URL = "postgresql://ar:dev_password@localhost:5432/ar_dev"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Agent Resources API",
    version="1.0.0",
    description="Control plane for managing AI agent fleets"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# DEPENDENCIES
# ============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_tenant(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> uuid.UUID:
    """Extract tenant_id from JWT and set session variable for RLS."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid authorization")

    token = authorization.split(" ")[1]

    # In production, verify JWT signature with proper secret/public key
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        tenant_id = payload.get("tenant_id")
        if not tenant_id:
            raise HTTPException(401, "Token missing tenant_id")
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {e}")

    # Set session variable for RLS
    db.execute(text(f"SET LOCAL app.current_tenant = '{tenant_id}'"))
    db.commit()

    return uuid.UUID(tenant_id)

# ============================================================================
# MODELS
# ============================================================================

class CreateTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    owner_org_id: Optional[str] = None
    tags: List[str] = []

class CreateVersionRequest(BaseModel):
    version_label: str
    artifact_hash: str
    model_bundle: Dict[str, Any]
    prompt_bundle: Dict[str, Any]
    tool_manifest: Dict[str, Any]
    data_scopes_declared: List[str] = []
    build_provenance: Optional[Dict[str, Any]] = None

class CreateInstanceRequest(BaseModel):
    version_id: str
    environment: str
    runtime_target: Optional[str] = None
    policy_envelope_id: str

class CreatePolicyRequest(BaseModel):
    name: str
    autonomy_tier: int
    allowed_tools: Dict[str, Any]
    allowed_data_scopes: List[str] = []
    rate_limits: Optional[Dict[str, Any]] = None
    cost_limits: Optional[Dict[str, Any]] = None
    guardrails: Optional[Dict[str, Any]] = None

# ============================================================================
# ROUTES: Templates & Versions
# ============================================================================

@app.post("/v1/templates")
async def create_template(
    req: CreateTemplateRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new agent template."""
    template_id = uuid.uuid4()

    db.execute(
        text("""
            INSERT INTO agent_templates (template_id, tenant_id, name, description, owner_org_id, tags)
            VALUES (:template_id, :tenant_id, :name, :description, :owner_org_id, :tags)
        """),
        {
            "template_id": template_id,
            "tenant_id": tenant_id,
            "name": req.name,
            "description": req.description,
            "owner_org_id": req.owner_org_id,
            "tags": req.tags
        }
    )
    db.commit()

    return {"template_id": str(template_id), "name": req.name}

@app.get("/v1/templates")
async def list_templates(
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all agent templates."""
    results = db.execute(
        text("SELECT template_id, name, description, tags, created_at FROM agent_templates ORDER BY created_at DESC")
    ).fetchall()

    return {
        "templates": [
            {
                "template_id": str(r[0]),
                "name": r[1],
                "description": r[2],
                "tags": r[3],
                "created_at": r[4].isoformat()
            }
            for r in results
        ]
    }

@app.post("/v1/templates/{template_id}/versions")
async def create_version(
    template_id: str,
    req: CreateVersionRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new agent version and trigger evaluation."""
    version_id = uuid.uuid4()

    db.execute(
        text("""
            INSERT INTO agent_versions (
                version_id, template_id, tenant_id, version_label, artifact_hash,
                model_bundle, prompt_bundle, tool_manifest, data_scopes_declared,
                build_provenance, release_status
            ) VALUES (
                :version_id, :template_id, :tenant_id, :version_label, :artifact_hash,
                :model_bundle, :prompt_bundle, :tool_manifest, :data_scopes_declared,
                :build_provenance, 'draft'
            )
        """),
        {
            "version_id": version_id,
            "template_id": uuid.UUID(template_id),
            "tenant_id": tenant_id,
            "version_label": req.version_label,
            "artifact_hash": req.artifact_hash,
            "model_bundle": req.model_bundle,
            "prompt_bundle": req.prompt_bundle,
            "tool_manifest": req.tool_manifest,
            "data_scopes_declared": req.data_scopes_declared,
            "build_provenance": req.build_provenance
        }
    )
    db.commit()

    # TODO: Trigger Temporal workflow to run evaluations

    return {
        "version_id": str(version_id),
        "template_id": template_id,
        "release_status": "draft",
        "message": "Version created. Evaluation will be triggered."
    }

@app.get("/v1/versions/{version_id}")
async def get_version(
    version_id: str,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get version details."""
    result = db.execute(
        text("""
            SELECT version_id, template_id, version_label, release_status,
                   model_bundle, prompt_bundle, created_at
            FROM agent_versions
            WHERE version_id = :version_id
        """),
        {"version_id": uuid.UUID(version_id)}
    ).fetchone()

    if not result:
        raise HTTPException(404, "Version not found")

    return {
        "version_id": str(result[0]),
        "template_id": str(result[1]),
        "version_label": result[2],
        "release_status": result[3],
        "model_bundle": result[4],
        "prompt_bundle": result[5],
        "created_at": result[6].isoformat()
    }

@app.post("/v1/versions/{version_id}/promote")
async def promote_version(
    version_id: str,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Promote version from candidate -> approved (with gates)."""

    current = db.execute(
        text("SELECT release_status FROM agent_versions WHERE version_id = :vid"),
        {"vid": uuid.UUID(version_id)}
    ).fetchone()

    if not current or current[0] != 'candidate':
        raise HTTPException(400, "Version must be in 'candidate' status")

    # Check evaluation results
    eval_results = db.execute(
        text("""
            SELECT status, summary_scores
            FROM evaluation_runs
            WHERE version_id = :vid AND status = 'passed'
            ORDER BY completed_at DESC LIMIT 1
        """),
        {"vid": uuid.UUID(version_id)}
    ).fetchone()

    if not eval_results:
        raise HTTPException(400, "No passing evaluation found")

    # Promote
    db.execute(
        text("UPDATE agent_versions SET release_status = 'approved' WHERE version_id = :vid"),
        {"vid": uuid.UUID(version_id)}
    )
    db.commit()

    # Emit event
    db.execute(
        text("""
            INSERT INTO events (tenant_id, event_type, actor_type, actor_id, payload)
            VALUES (:tid, 'AgentVersionPromoted', 'system', :tid, :payload)
        """),
        {
            "tid": tenant_id,
            "payload": {"version_id": version_id, "from": "candidate", "to": "approved"}
        }
    )
    db.commit()

    return {"version_id": version_id, "release_status": "approved"}

# ============================================================================
# ROUTES: Instances
# ============================================================================

@app.post("/v1/instances")
async def create_instance(
    req: CreateInstanceRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Provision a new agent instance."""
    instance_id = uuid.uuid4()

    db.execute(
        text("""
            INSERT INTO agent_instances (
                instance_id, version_id, tenant_id, environment, runtime_target,
                policy_envelope_id, status
            ) VALUES (
                :instance_id, :version_id, :tenant_id, :environment, :runtime_target,
                :policy_envelope_id, 'provisioning'
            )
        """),
        {
            "instance_id": instance_id,
            "version_id": uuid.UUID(req.version_id),
            "tenant_id": tenant_id,
            "environment": req.environment,
            "runtime_target": req.runtime_target,
            "policy_envelope_id": uuid.UUID(req.policy_envelope_id)
        }
    )
    db.commit()

    return {"instance_id": str(instance_id), "status": "provisioning"}

@app.get("/v1/instances")
async def list_instances(
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all agent instances."""
    results = db.execute(
        text("""
            SELECT i.instance_id, i.version_id, i.environment, i.status, i.created_at,
                   v.version_label, t.name as template_name
            FROM agent_instances i
            JOIN agent_versions v ON i.version_id = v.version_id
            JOIN agent_templates t ON v.template_id = t.template_id
            ORDER BY i.created_at DESC
        """)
    ).fetchall()

    return {
        "instances": [
            {
                "instance_id": str(r[0]),
                "version_id": str(r[1]),
                "environment": r[2],
                "status": r[3],
                "created_at": r[4].isoformat(),
                "version_label": r[5],
                "template_name": r[6]
            }
            for r in results
        ]
    }

@app.patch("/v1/instances/{instance_id}")
async def update_instance(
    instance_id: str,
    status: str,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Update instance status (pause, quarantine, retire)."""
    db.execute(
        text("UPDATE agent_instances SET status = :status WHERE instance_id = :iid"),
        {"status": status, "iid": uuid.UUID(instance_id)}
    )
    db.commit()

    return {"instance_id": instance_id, "status": status}

# ============================================================================
# ROUTES: Policies
# ============================================================================

@app.post("/v1/policies")
async def create_policy(
    req: CreatePolicyRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new policy envelope."""
    policy_id = uuid.uuid4()

    db.execute(
        text("""
            INSERT INTO policy_envelopes (
                policy_id, tenant_id, name, autonomy_tier, allowed_tools,
                allowed_data_scopes, rate_limits, cost_limits, guardrails
            ) VALUES (
                :policy_id, :tenant_id, :name, :autonomy_tier, :allowed_tools,
                :allowed_data_scopes, :rate_limits, :cost_limits, :guardrails
            )
        """),
        {
            "policy_id": policy_id,
            "tenant_id": tenant_id,
            "name": req.name,
            "autonomy_tier": req.autonomy_tier,
            "allowed_tools": req.allowed_tools,
            "allowed_data_scopes": req.allowed_data_scopes,
            "rate_limits": req.rate_limits,
            "cost_limits": req.cost_limits,
            "guardrails": req.guardrails
        }
    )
    db.commit()

    return {"policy_id": str(policy_id), "name": req.name}

@app.get("/v1/policies")
async def list_policies(
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """List all policy envelopes."""
    results = db.execute(
        text("SELECT policy_id, name, autonomy_tier, created_at FROM policy_envelopes ORDER BY created_at DESC")
    ).fetchall()

    return {
        "policies": [
            {
                "policy_id": str(r[0]),
                "name": r[1],
                "autonomy_tier": r[2],
                "created_at": r[3].isoformat()
            }
            for r in results
        ]
    }

@app.get("/v1/policies/{policy_id}")
async def get_policy(
    policy_id: str,
    tenant_id: uuid.UUID = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get policy envelope details."""
    result = db.execute(
        text("""
            SELECT policy_id, name, autonomy_tier, allowed_tools, allowed_data_scopes,
                   rate_limits, cost_limits, guardrails, created_at
            FROM policy_envelopes
            WHERE policy_id = :pid
        """),
        {"pid": uuid.UUID(policy_id)}
    ).fetchone()

    if not result:
        raise HTTPException(404, "Policy not found")

    return {
        "policy_id": str(result[0]),
        "name": result[1],
        "autonomy_tier": result[2],
        "allowed_tools": result[3],
        "allowed_data_scopes": result[4],
        "rate_limits": result[5],
        "cost_limits": result[6],
        "guardrails": result[7],
        "created_at": result[8].isoformat()
    }

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health():
    return {"status": "ok", "service": "control-plane"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
