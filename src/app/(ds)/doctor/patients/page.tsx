'use client';

import { useState, useEffect } from 'react';
import { useAuthHooks } from '@/hooks/useAuth';
import api from '@/lib/api/api';

interface Patient {
  userId: string;
  email: string;
  phoneNumber?: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

export default function PatientsPage() {
  const { user } = useAuthHooks();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const response = await api.get('/provider/patients');
        setPatients(response.data.data);
      } catch (err: unknown) {
        let msg = 'Failed to fetch patients';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response: { data?: { message?: string } } };
          if (axiosErr.response.data?.message) msg = axiosErr.response.data.message;
        } else if (err instanceof Error) msg = err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div
        className="mb-8 p-6 rounded-xl shadow-md"
        style={{ backgroundColor: '#C4E1E1' }}
      >
        <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
        <p className="text-gray-700 mt-2">
          Welcome back, <span className="font-semibold">{user.profile?.firstName} {user.profile?.lastName}</span>.
          Here’s a list of your registered patients.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-gray-500">
          Loading patients...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Patients List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.length > 0 ? (
            patients.map((patient: Patient) => (
              <div
                key={patient.userId}
                className="bg-white shadow-sm rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {patient.profile?.firstName} {patient.profile?.lastName}
                </h2>
                <p className="text-gray-600 mt-1">{patient.email}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Phone: {patient.phoneNumber || 'N/A'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No patients found.</p>
          )}
        </div>
      )}
    </div>
  );
}
