import FirebaseDebug from '@/components/admin/FirebaseDebug';

export default function AdminDebugPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Firebase Debug</h1>
        <p className="text-muted-foreground">
          Firebase authentication sorunlarını çözmek için debug araçları
        </p>
      </div>
      
      <FirebaseDebug />
    </div>
  );
} 