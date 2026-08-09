'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'admin' | 'manager' | 'member';
type Member = { user_id: string; email: string | null; role: string; joined_at: string };
type Invitation = { id: string; email: string; role: string; expires_at: string };

export default function TeamManager({ members, invitations, canManage }: { members: Member[]; invitations: Invitation[]; canManage: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('Creating invitation...');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/team', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: form.get('email'), role: form.get('role') }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error || 'Could not create the invitation.');
    setMessage(body.emailSent ? 'Invitation sent.' : 'Invitation saved. If this person already has an account, ask them to sign in with that email.');
    event.currentTarget.reset();
    router.refresh();
  }

  async function updateRole(payload: { memberId?: string; invitationId?: string; role: Role }) {
    setBusy(true);
    const response = await fetch('/api/team', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || 'Could not update the role.');
    router.refresh();
  }

  async function remove(kind: 'memberId' | 'invitationId', id: string) {
    if (!window.confirm(kind === 'memberId' ? 'Remove this member from the workspace?' : 'Cancel this invitation?')) return;
    setBusy(true);
    const response = await fetch(`/api/team?${kind}=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || 'Could not update the team.');
    router.refresh();
  }

  return <div className="stack"><section className="card table-card"><div className="table-toolbar"><div><h2>Active members</h2><p className="muted">Roles are enforced on the server and in database policies.</p></div></div><div className="data-table team-table"><div className="data-row data-head"><span>Member</span><span>Role</span><span>Joined</span><span>Actions</span></div>{members.map((member) => <div className="data-row" key={member.user_id}><span><b>{member.email || 'Email unavailable'}</b><small>{member.user_id}</small></span><span>{member.role === 'owner' || !canManage ? <span className="pill">{member.role}</span> : <select className="input compact" value={member.role} disabled={busy} onChange={(event) => updateRole({ memberId: member.user_id, role: event.target.value as Role })}><option value="admin">Admin</option><option value="manager">Manager</option><option value="member">Member</option></select>}</span><span>{new Date(member.joined_at).toLocaleDateString()}</span><span>{canManage && member.role !== 'owner' && <button className="mini danger" type="button" onClick={() => remove('memberId', member.user_id)}>Remove</button>}</span></div>)}</div></section>{canManage && <section className="card invite-panel"><div><div className="eyebrow">Secure access</div><h2>Invite a teammate</h2><p className="muted">Invitations expire after seven days. Existing users are added when they next sign in.</p></div><form className="invite-form" onSubmit={invite}><input className="input" name="email" type="email" required placeholder="teammate@company.com" /><select className="input" name="role" defaultValue="member"><option value="admin">Admin</option><option value="manager">Manager</option><option value="member">Member</option></select><button className="btn" disabled={busy}>{busy ? 'Working...' : 'Send invite'}</button></form>{message && <p className="notice" role="status">{message}</p>}</section>}{invitations.length > 0 && <section className="card table-card"><h2>Pending invitations</h2><div className="data-table"><div className="data-row data-head"><span>Email</span><span>Role</span><span>Expires</span><span>Actions</span></div>{invitations.map((invite) => <div className="data-row" key={invite.id}><b>{invite.email}</b><span>{canManage ? <select className="input compact" value={invite.role} onChange={(event) => updateRole({ invitationId: invite.id, role: event.target.value as Role })}><option value="admin">Admin</option><option value="manager">Manager</option><option value="member">Member</option></select> : invite.role}</span><span>{new Date(invite.expires_at).toLocaleDateString()}</span><span>{canManage && <button className="mini danger" type="button" onClick={() => remove('invitationId', invite.id)}>Cancel</button>}</span></div>)}</div></section>}</div>;
}
