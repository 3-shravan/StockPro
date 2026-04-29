/** 403 Unauthorized Page */
export const UnauthorizedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-destructive">403</h1>
      <p className="text-muted-foreground mt-2">You do not have permission to access this page.</p>
    </div>
  </div>
);
