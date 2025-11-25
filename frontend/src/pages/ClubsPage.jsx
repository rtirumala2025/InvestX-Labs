import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { useClubs } from '../contexts/ClubsContext';
import { useApp } from '../contexts/AppContext';

const initialFormState = {
  name: '',
  description: '',
  focus: '',
  meetingCadence: ''
};

const ClubsPage = () => {
  const {
    clubs,
    loading,
    error,
    offline,
    pendingActions,
    createClub,
    selectClub,
    selectedClubId
  } = useClubs();
  const { queueToast } = useApp();
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteClubId, setInviteClubId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // Task 15: Club search, categories/tags, and invitations
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    clubs.forEach(club => {
      if (club.focus) {
        const focusParts = club.focus.split(',').map(f => f.trim());
        focusParts.forEach(part => cats.add(part));
      }
    });
    return Array.from(cats);
  }, [clubs]);

  const sortedClubs = useMemo(
    () =>
      [...clubs].sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })),
    [clubs]
  );

  const filteredClubs = useMemo(() => {
    let filtered = sortedClubs;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(club =>
        club.name?.toLowerCase().includes(query) ||
        club.description?.toLowerCase().includes(query) ||
        club.focus?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(club =>
        club.focus?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    
    return filtered;
  }, [sortedClubs, searchQuery, selectedCategory]);

  const handleInvite = async (clubId) => {
    setInviteClubId(clubId);
    setShowInviteModal(true);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteClubId) {
      queueToast('Please enter a valid email address', 'warning');
      return;
    }

    try {
      // In a real implementation, you'd call an invitation API
      // For now, we'll add the member directly
      const response = await fetch(`/api/clubs/${inviteClubId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: inviteEmail, // In real app, resolve email to userId
          role: 'member'
        })
      });

      if (response.ok) {
        queueToast('Invitation sent successfully', 'success');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteClubId(null);
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      queueToast(error.message || 'Failed to send invitation', 'error');
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClub = async (event) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      queueToast('Please provide a name for your club.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await createClub({
        ...formState,
        ownerId: undefined
      });
      setFormState(initialFormState);
    } catch (createError) {
      queueToast(createError.message || 'Unable to create club.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 w-[28rem] h-[28rem] bg-gradient-to-r from-blue-500/25 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-28 w-[30rem] h-[30rem] bg-gradient-to-r from-violet-500/20 to-purple-400/15 rounded-full blur-3xl animate-pulse delay-150" />
      </div>

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 lg:px-6 xl:px-8 py-6 lg:py-10 space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-teal-200 to-emerald-200 mb-2">
              Investment Clubs Hub
            </h1>
            <p className="text-white/70 max-w-2xl">
              Create clubs, collaborate with friends, and track your community investing journey. Every change syncs
              automatically—offline edits will queue until you reconnect.
            </p>
          </div>
          {offline || pendingActions.length ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 backdrop-blur-lg shadow-lg shadow-amber-500/10">
              <span className="text-amber-300 text-sm font-semibold">
                {offline ? 'Offline Mode' : 'Syncing soon'}
              </span>
              {pendingActions.length ? (
                <span className="text-xs text-amber-200/80">
                  {pendingActions.length} action{pendingActions.length === 1 ? '' : 's'} pending
                </span>
              ) : null}
            </div>
          ) : null}
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <GlassCard variant="floating" padding="large" className="xl:col-span-1 backdrop-blur-2xl border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Start a new club</h2>
            <form className="space-y-4" onSubmit={handleCreateClub}>
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Club Name</label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  placeholder="Future Builders"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Focus</label>
                <input
                  type="text"
                  name="focus"
                  value={formState.focus}
                  onChange={handleInputChange}
                  placeholder="Dividend strategies, growth investing..."
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Meeting cadence</label>
                <input
                  type="text"
                  name="meetingCadence"
                  value={formState.meetingCadence}
                  onChange={handleInputChange}
                  placeholder="Weekly, bi-weekly, monthly..."
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/60 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="What do you explore, track, or celebrate together?"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 text-white placeholder-white/40 resize-none"
                />
              </div>
              <GlassButton
                variant="primary"
                size="default"
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Creating club…' : 'Launch Club 🚀'}
              </GlassButton>
            </form>
          </GlassCard>

          <div className="xl:col-span-2 space-y-6">
            <GlassCard variant="accent" padding="large" glow className="border-white/10">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Your clubs</h2>
                    <p className="text-sm text-white/70">
                      Browse communities, open detailed dashboards, or invite friends to collaborate.
                    </p>
                  </div>
                  <div className="flex gap-3 text-white/70 text-xs">
                    <span>Clubs: {filteredClubs.length} / {clubs.length}</span>
                    <span>Pending actions: {pendingActions.length}</span>
                    {offline ? <span className="text-amber-300">Offline mode</span> : null}
                  </div>
                </div>
                
                {/* Search and Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search clubs by name, description, or focus..."
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1 rounded-lg text-sm transition-all ${
                          selectedCategory === category
                            ? 'bg-blue-500/30 text-white border border-blue-400/30'
                            : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border border-white/10'
                        }`}
                      >
                        {category === 'all' ? 'All Categories' : category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            {loading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="large" />
              </div>
            ) : null}

            {error && !loading ? (
              <GlassCard variant="default" padding="large" className="border border-red-400/40 bg-red-500/10">
                <p className="text-sm text-red-200/90">{error}</p>
              </GlassCard>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredClubs.map((club) => {
                const isSelected = selectedClubId === club.id;
                return (
                  <GlassCard
                    key={club.id}
                    variant="floating"
                    padding="large"
                    interactive
                    className={`border transition-all ${
                      isSelected ? 'border-blue-400/40 shadow-blue-500/20' : 'border-white/10'
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{club.name}</h3>
                          {club.focus ? <p className="text-sm text-white/60">Focus: {club.focus}</p> : null}
                          {club.meetingCadence ? (
                            <p className="text-xs text-white/50 mt-1">Cadence: {club.meetingCadence}</p>
                          ) : null}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70 border border-white/10">
                          {club.metrics?.members ?? '—'} members
                        </span>
                      </div>
                      {club.description ? (
                        <p className="text-sm text-white/70 leading-relaxed">{club.description}</p>
                      ) : (
                        <p className="text-sm text-white/40 italic">No description yet.</p>
                      )}
                      <div className="flex gap-3">
                        <GlassButton
                          as={Link}
                          to={`/clubs/${club.id}`}
                          variant="glass"
                          size="small"
                          onClick={() => selectClub(club.id)}
                          className="flex-1"
                        >
                          View Club
                        </GlassButton>
                        <GlassButton
                          variant="glass"
                          size="small"
                          onClick={() => handleInvite(club.id)}
                        >
                          👥 Invite
                        </GlassButton>
                        <GlassButton
                          variant={isSelected ? 'primary' : 'glass'}
                          size="small"
                          onClick={() => selectClub(club.id)}
                        >
                          {isSelected ? 'Selected' : 'Set Active'}
                        </GlassButton>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}

              {!loading && !filteredClubs.length && clubs.length > 0 ? (
                <GlassCard variant="default" padding="large" className="text-center text-white/70 col-span-full">
                  <p>No clubs match your search. Try adjusting your filters.</p>
                </GlassCard>
              ) : null}

              {!loading && !clubs.length ? (
                <GlassCard variant="default" padding="large" className="text-center text-white/70">
                  <p>No clubs yet. Create one to get started!</p>
                </GlassCard>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      {/* Invitation Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteClubId(null);
        }}
        title="Invite Member to Club"
        size="default"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <GlassButton
              variant="glass"
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteClubId(null);
              }}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSendInvite}
              disabled={!inviteEmail.trim()}
            >
              Send Invitation
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClubsPage;

