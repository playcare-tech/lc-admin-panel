function inviteDisplayName(firstName, lastName, fallback) {
  return [firstName, lastName].filter(Boolean).join(" ") || fallback || "there";
}

function inviteEmailText({ username, firstName, lastName, inviteLink, inviteExpiresAt }) {
  const name = inviteDisplayName(firstName, lastName, username);
  return [
    `Hi ${name},`,
    "",
    "You have been invited to Playcare CS Admin Panel.",
    "",
    `Username: ${username}`,
    `Registration link: ${inviteLink}`,
    inviteExpiresAt ? `This link expires at: ${inviteExpiresAt}` : "",
    "",
    "Open the link to create your password and set up 2FA.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function inviteEmailHtml({ username, firstName, lastName, inviteLink, inviteExpiresAt }) {
  const name = escapeHtml(inviteDisplayName(firstName, lastName, username));
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <p>Hi ${name},</p>
      <p>You have been invited to <strong>Playcare CS Admin Panel</strong>.</p>
      <p><strong>Username:</strong> ${escapeHtml(username)}</p>
      <p>
        <a href="${escapeHtml(inviteLink)}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
          Complete registration
        </a>
      </p>
      <p style="word-break:break-all">${escapeHtml(inviteLink)}</p>
      ${inviteExpiresAt ? `<p>This link expires at: ${escapeHtml(inviteExpiresAt)}.</p>` : ""}
      <p>Open the link to create your password and set up 2FA.</p>
    </div>
  `;
}

function escapeHtml(value) {
  return `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendAdminInviteEmail(env, invite) {
  const to = `${invite.inviteEmail || ""}`.trim();
  if (!to) return { sent: false, reason: "missing_email" };

  const resendApiKey = env.RESEND_API_KEY;
  const from = env.ADMIN_INVITE_FROM_EMAIL;
  if (!resendApiKey || !from) {
    return { sent: false, reason: "missing_email_provider" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Your Playcare CS Admin invitation",
      text: inviteEmailText(invite),
      html: inviteEmailHtml(invite),
    }),
  });

  if (!response.ok) {
    let error = "";
    try {
      const payload = await response.json();
      error = payload?.message || payload?.error || "";
    } catch {
      error = await response.text().catch(() => "");
    }
    throw new Error(`Failed to send invitation email${error ? `: ${error}` : "."}`);
  }

  return { sent: true };
}
