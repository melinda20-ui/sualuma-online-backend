import { getUsersWithAccess } from './actions';
import UsuariosClient from './UsuariosClient';

export default async function UsuariosPage() {
  // Fetch initial data on the server
  let initialUsers: any[] = [];
  try {
    initialUsers = await getUsersWithAccess();
  } catch (error) {
    console.error("Failed to fetch initial users:", error);
  }

  return (
    <main className="min-h-screen">
      <UsuariosClient initialUsers={initialUsers} />
    </main>
  );
}
