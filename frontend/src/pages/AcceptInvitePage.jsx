import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/AuthLayout.jsx'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const { token: authToken, user } = useAuth()
  const navigate = useNavigate()

  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    orgApi
      .getInvitePreview(token)
      .then((res) => setPreview(res.data))
      .catch(() => setPreview({ valid: false, reasonIfInvalid: 'This invite link is invalid or has expired.' }))
  }, [token])

  async function accept() {
    setError('')
    setAccepting(true)
    try {
      await orgApi.acceptInvite(token)
      setAccepted(true)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setAccepting(false)
    }
  }

  if (!preview) {
    return <AuthLayout eyebrow="Invitation" title="Loading invite…" />
  }

  if (!preview.valid) {
    return (
      <AuthLayout eyebrow="Invitation" title="This invite isn't valid">
        <p className="nf-alert nf-alert-error">{preview.reasonIfInvalid}</p>
      </AuthLayout>
    )
  }

  const roleLabel = preview.role.replaceAll('_', ' ').toLowerCase()

  if (accepted) {
    return (
      <AuthLayout eyebrow="Invitation" title={`Welcome to ${preview.orgName}`}>
        <p className="nf-alert nf-alert-success">You're in. Redirecting to your dashboard…</p>
      </AuthLayout>
    )
  }

  if (!authToken) {
    return (
      <AuthLayout
        eyebrow="Invitation"
        title={`Join ${preview.orgName}`}
        subtitle={`You've been invited as ${roleLabel}.`}
      >
        <button className="nf-btn nf-btn-primary" onClick={() => navigate(`/signup?invite=${token}`)}>
          Create your account to accept
        </button>
      </AuthLayout>
    )
  }

  if (user && user.email.toLowerCase() !== preview.invitedEmail.toLowerCase()) {
    return (
      <AuthLayout eyebrow="Invitation" title="Wrong account">
        <p className="nf-alert nf-alert-info">
          This invite was sent to <strong>{preview.invitedEmail}</strong>, but you're signed in as{' '}
          <strong>{user.email}</strong>. Log out and sign in with the invited email to accept.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Invitation"
      title={`Join ${preview.orgName}`}
      subtitle={`You've been invited as ${roleLabel}.`}
    >
      {error && <p className="nf-alert nf-alert-error">{error}</p>}
      <button onClick={accept} disabled={accepting} className="nf-btn nf-btn-primary">
        {accepting ? 'Joining…' : `Accept & join ${preview.orgName}`}
      </button>
    </AuthLayout>
  )
}