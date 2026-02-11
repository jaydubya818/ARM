import { SignInButton, SignUpButton } from '@clerk/clerk-react';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-arm-surface">
      <div className="text-center max-w-md p-8 bg-white rounded-xl border border-arm-border shadow-lg">
        <h1 className="text-2xl font-bold text-arm-text mb-2">ARM</h1>
        <p className="text-arm-textMuted mb-6">Agent Resource Management</p>
        <div className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <button className="w-full px-4 py-3 bg-arm-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full px-4 py-3 bg-arm-surface border border-arm-border text-arm-text rounded-lg font-medium hover:bg-arm-surfaceLight transition-colors">
              Create Account
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
