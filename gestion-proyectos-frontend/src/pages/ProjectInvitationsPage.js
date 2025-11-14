import React, { useEffect, useState, useContext, useCallback } from 'react';
import projectService from '../services/projectService';
import { useToast } from '../components/common/ToastProvider';
import './DashboardPage.css';
import './Form.css';
import { LocaleContext } from '../i18n/LocaleContext';

const ProjectInvitationsPage = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const toast = useToast();
  const { t } = useContext(LocaleContext);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const list = await projectService.listMyInvitations();
      setInvites(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(t('invitationsPage:loadError'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const accept = async (id) => {
    try {
      await projectService.acceptInvitation(id);
      setMsg(t('invitationsPage:acceptedMsg'));
      toast?.success(t('invitationsPage:accept'));
      await load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      const m = t('invitationsPage:loadError');
      setErr(m); toast?.error(m); setTimeout(() => setErr(''), 3000);
    }
  };
  const decline = async (id) => {
    try {
      await projectService.declineInvitation(id);
      setMsg(t('invitationsPage:declinedMsg'));
      toast?.info(t('invitationsPage:decline'));
      await load();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      const m = t('invitationsPage:loadError');
      setErr(m); toast?.error(m); setTimeout(() => setErr(''), 3000);
    }
  };

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="form-container center-eq-sidebar" style={{ width: '100%', maxWidth: 1100, margin: '3rem auto' }}>
          <h2 style={{ marginTop: 8, marginBottom: 8 }}>{t('invitationsPage:title')}</h2>
          {msg && <div style={{ background:'#ecfdf5', color:'#065f46', border:'1px solid #a7f3d0', padding:'8px 12px', borderRadius:6, marginBottom:12 }}>{msg}</div>}
          {err && <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:6, marginBottom: 12 }}>{err}</div>}
          {loading ? (
            <p>{t('invitationsPage:loading')}</p>
          ) : invites.length === 0 ? (
            <p>{t('invitationsPage:none')}</p>
          ) : (
            <table className="table-clean invites-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}><span className="th-center th-nudge-left">{t('invitationsPage:project')}</span></th>
                  <th style={{ textAlign: 'center' }}><span className="th-center">{t('invitationsPage:invitedBy')}</span></th>
                  <th style={{ textAlign: 'center' }}><span className="th-center">{t('invitationsPage:date')}</span></th>
                  <th style={{ textAlign: 'center' }}><span className="th-center th-nudge-right">{t('invitationsPage:actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i._id}>
                    <td style={{ fontWeight: 500 }}>{i.project?.name || t('invitationsPage:project')}</td>
                    <td className="invited-cell">
                      <div>{i.inviter?.name}</div>
                      <div className="muted invited-email">({i.inviter?.email})</div>
                    </td>
                    <td>
                      {i.createdAt ? (
                        (() => {
                          const d = new Date(i.createdAt);
                          const dateStr = d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
                          const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
                          return (
                            <div className="date-cell">
                              <div>{dateStr}</div>
                              <div className="time">{timeStr}</div>
                            </div>
                          );
                        })()
                      ) : '-'}
                    </td>
                    <td
                      className="table-actions"
                      style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, minWidth: 200, flexWrap: 'nowrap' }}
                    >
                      <button className="action-btn btn-compact btn-success" onClick={() => accept(i._id)}>{t('invitationsPage:accept')}</button>
                      <button className="action-btn btn-compact btn-danger" onClick={() => decline(i._id)}>{t('invitationsPage:decline')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInvitationsPage;
