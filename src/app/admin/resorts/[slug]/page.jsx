'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetResortQuery } from '@/store/api';
import ResortForm from '@/components/admin/ResortForm';

export default function EditResortPage() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useGetResortQuery(slug);
  const resort = data?.resort;

  if (isLoading) return <div className="text-charcoal-400 text-sm">Loading…</div>;
  if (isError || !resort) {
    return (
      <div className="card p-8 text-center">
        <p className="text-charcoal-400">Resort not found.</p>
        <Link href="/admin/resorts" className="btn btn-outline mt-4">Back to resorts</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-display mb-1">Edit resort</h1>
      <p className="text-sm text-charcoal-400 mb-6">{resort.name}</p>
      <ResortForm resort={resort} />
    </div>
  );
}
