import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useClubs } from '../contexts/ClubsContext';
import { useApp } from '../contexts/AppContext';

const ClubDetailPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const {
    clubs,
    loading,
    error,
    offline,
    pendingActions,
    updateClub,
    deleteClub,
    resolveClubById,
    selectClub
  } = useClubs();
  const { queueToast } = useApp();

  const [club, setClub] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    focus: '',
    meetingCadence: '',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fallbackClub = useMemo(
    () => clubs.find((entry) => String(entry.id) === String(clubId)) || null,
    [clubs, clubId]
  );

  useEffect(() => {
    const loadClub = async () => {
      if (!clubId) return;
      const resolved = await resolveClubById(clubId);
      const nextClub = resolved || fallbackClub;
      if (!nextClub) {
        queueToast('Club not found.', 'error');
        navigate('/clubs');
        return;
      }
      setClub(nextClub);
      setFormState({
        name: nextClub.name || '',
        focus: nextClub.focus || '',
        meetingCadence: nextClub.meetingCadence || nextClub.meeting_cadence || '',
        description: nextClub.description || ''
      });
      selectClub(nextClub.id);
    };
    loadClub();
  }, [clubId, fallbackClub, navigate, queueToast, resolveClubById, selectClub]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!club) return;
    if (!formState.name.trim()) {
      queueToast('Club name cannot be empty.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateClub(club.id, {
        name: formState.name.trim(),
        focus: formState.focus.trim(),
        meetingCadence: formState.meetingCadence.trim(),
        description: formState.description.trim()
      });
    } catch (saveError) {
      queueToast(saveError.message || 'Unable to update club.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!club) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this club?');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteClub(club.id);
      navigate('/clubs');
    } catch (deleteError) {
      queueToast(deleteError.message || 'Unable to delete club.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !club) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
        <main className="relative z-10 w-full max-w-4xl mx-auto px-4 lg:px-6 xl:px-8 py-10">
          <GlassCard variant="default" padding="large" className="text-center border border-white/10">
            <h2 className="text-2xl font-semibold mb-2">Club not found</h2>
            <p className="text-white/60 mb-6">The club you are looking for may have been deleted or is unavailable.</p>
            <GlassButton as={Link} to="/clubs" variant="primary">
              ← Back to Clubs
            </GlassButton>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-36 -left-28 w-[26rem] h-[26rem] bg-gradient-to-r from-sky-500/25 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-44 -right-32 w-[28rem] h-[28rem] bg-gradient-to-r from-emerald-500/20 to-lime-400/15 rounded-full blur-3xl animate-pulse delay-150" />
      </div>

      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 lg:px-6 xl:px-8 py-8 lg:py-12 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-sky-200 to-blue-200">
              {club.name}
            </h1>
            <p className="text-sm text-white/60">
              {club.focus ? `Focus: ${club.focus}` : 'Define your club focus to help investors find you.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <GlassButton as={Link} to="/clubs" variant="glass">
              ← Back to Clubs
            </GlassButton>
            <GlassButton variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete Club'}
            </GlassButton>
          </div>
        </div>

        {offline ? (
          <GlassCard variant="default" padding="large" className="border border-amber-400/30 bg-amber-500/10">
            <p className="text-sm text-amber-200">
              You are working offline. Updates will sync automatically once you reconnect.
            </p>
            {pendingActions.length ? (
              <p className="text-xs text-amber-200/80 mt-2">
                {pendingActions.length} pending action{pendingActions.length === 1 ? '' : 's'} in the queue.
              </p>
            ) : null}
          </GlassCard>
        ) : null}

        {error ? (
          <GlassCard variant="default" padding="large" className="border border-red-400/30 bg-red-500/10">
            <p className="text-sm text-red-200/90">{error}</p>
          </GlassCard>
        ) : null}

        <GlassCard variant="floating" padding="large" className="space-y-6 border border-white/10 backdrop-blur-2xl">
          <form className="space-y-5" onSubmit={handleSave}>
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Club Name</label>
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 text-white placeholder-white/40"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Focus</label>
                <input
                  type="text"
                  name="focus"
                  value={formState.focus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Meeting cadence</label>
                <input
                  type="text"
                  name="meetingCadence"
                  value={formState.meetingCadence}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 text-white placeholder-white/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Description</label>
              <textarea
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 text-white placeholder-white/40 resize-none"
                placeholder="Share what your club explores, how to join, and how you collaborate."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton type="submit" variant="primary" disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Changes'}
              </GlassButton>
              <GlassButton type="button" variant="glass" onClick={() => navigate('/clubs')}>
                Cancel
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </main>
    </div>
  );
};

export default ClubDetailPage;

