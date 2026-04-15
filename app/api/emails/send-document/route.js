import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com';

function htmlWrapper(title, body) {
  return `
    <div style="font-family:Arial,sans-serif;padding:24px;color:#111">
      <h2 style="margin:0 0 16px 0;">${title}</h2>
      <div style="font-size:14px;line-height:1.6;">${body}</div>
    </div>
  `;
}

async function getInvoice(invoiceId) {
  const { data, error } = await supabase
    .from('invoice_documents')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (error || !data) throw new Error('Rechnung nicht gefunden.');
  return data;
}

async function getReminder(reminderId) {
  const { data, error } = await supabase
    .from('invoice_reminders')
    .select('*')
    .eq('id', reminderId)
    .single();

  if (error || !data) throw new Error('Mahnung nicht gefunden.');
  return data;
}

async function getRecipientEmailByCustomer(customerId) {
  if (!customerId) return '';
  const { data } = await supabase
    .from('customers')
    .select('email')
    .eq('id', customerId)
    .single();

  return data?.email || '';
}

async function fetchPdfBase64(req, invoiceId) {
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host');
  if (!host) throw new Error('Host Header fehlt.');

  const res = await fetch(`${protocol}://${host}/api/invoices/pdf/${invoiceId}`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error('PDF konnte nicht geladen werden.');
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

async function sendWithResend({ to, subject, html, attachments = [] }) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY fehlt.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      attachments
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || data?.error || 'Versand über Resend fehlgeschlagen.');
  }

  return data;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const documentType = String(body.document_type || '').trim();
    const documentId = String(body.document_id || '').trim();

    if (!documentType || !documentId) {
      return Response.json(
        { success: false, message: 'document_type oder document_id fehlt.' },
        { status: 400 }
      );
    }

    let recipientEmail = String(body.recipient_email || '').trim();
    let subject = String(body.subject || '').trim();
    let html = '';
    let attachmentName = '';
    let attachments = [];
    let documentRecord = null;

    if (documentType === 'invoice') {
      const invoice = await getInvoice(documentId);
      documentRecord = invoice;

      if (!recipientEmail) {
        recipientEmail = await getRecipientEmailByCustomer(invoice.customer_id);
      }

      subject = subject || `Rechnung ${invoice.invoice_number || ''}`.trim();
      html = htmlWrapper(
        'Ihre Rechnung',
        `anbei erhalten Sie Ihre Rechnung ${invoice.invoice_number || ''}.`
      );

      const pdfBase64 = await fetchPdfBase64(req, invoice.id);
      attachmentName = `${invoice.invoice_number || 'rechnung'}.pdf`;
      attachments = [
        {
          filename: attachmentName,
          content: pdfBase64
        }
      ];
    } else if (documentType === 'reminder') {
      const reminder = await getReminder(documentId);
      const invoice = await getInvoice(reminder.invoice_id);
      documentRecord = reminder;

      if (!recipientEmail) {
        recipientEmail = await getRecipientEmailByCustomer(invoice.customer_id);
      }

      subject = subject || `Mahnung Stufe ${reminder.level} zu Rechnung ${invoice.invoice_number || ''}`.trim();
      html = htmlWrapper(
        `Mahnung Stufe ${reminder.level}`,
        `Ihre Rechnung ${invoice.invoice_number || ''} ist weiterhin offen. Bitte begleichen Sie den offenen Betrag.`
      );

      const pdfBase64 = await fetchPdfBase64(req, invoice.id);
      attachmentName = `${invoice.invoice_number || 'rechnung'}.pdf`;
      attachments = [
        {
          filename: attachmentName,
          content: pdfBase64
        }
      ];
    } else {
      return Response.json(
        { success: false, message: 'document_type wird nicht unterstützt.' },
        { status: 400 }
      );
    }

    if (!recipientEmail) {
      return Response.json(
        { success: false, message: 'Empfänger-E-Mail konnte nicht ermittelt werden.' },
        { status: 400 }
      );
    }

    const { data: emailLog, error: logError } = await supabase
      .from('document_emails')
      .insert({
        document_type: documentType,
        document_id: documentId,
        recipient_email: recipientEmail,
        subject,
        body: html,
        status: 'pending',
        provider: 'resend',
        attachment_type: 'pdf',
        attachment_name: attachmentName || null
      })
      .select('*')
      .single();

    if (logError || !emailLog) {
      throw new Error(logError?.message || 'E-Mail-Log konnte nicht angelegt werden.');
    }

    try {
      const providerResponse = await sendWithResend({
        to: recipientEmail,
        subject,
        html,
        attachments
      });

      await supabase
        .from('document_emails')
        .update({
          status: 'sent',
          provider_message_id: providerResponse?.id || null,
          sent_at: new Date().toISOString()
        })
        .eq('id', emailLog.id);

      if (documentType === 'reminder') {
        await supabase
          .from('invoice_reminders')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', documentId);
      }

      if (documentType === 'invoice') {
        await supabase
          .from('invoice_events')
          .insert({
            invoice_id: documentId,
            event_type: 'email_sent',
            event_label: 'Rechnung per E-Mail versendet',
            actor: 'system',
            actor_type: 'system',
            payload: {
              recipient_email: recipientEmail,
              subject
            }
          });
      }

      if (documentType === 'reminder') {
        const invoiceId = documentRecord?.invoice_id || null;
        if (invoiceId) {
          await supabase
            .from('invoice_events')
            .insert({
              invoice_id: invoiceId,
              event_type: 'reminder_email_sent',
              event_label: 'Mahnung per E-Mail versendet',
              actor: 'system',
              actor_type: 'system',
              payload: {
                recipient_email: recipientEmail,
                subject,
                reminder_id: documentId
              }
            });
        }
      }

      return Response.json({
        success: true,
        message: 'E-Mail versendet.'
      });
    } catch (sendError) {
      await supabase
        .from('document_emails')
        .update({
          status: 'failed',
          error_message: sendError.message || 'Versand fehlgeschlagen.'
        })
        .eq('id', emailLog.id);

      return Response.json(
        { success: false, message: sendError.message || 'Versand fehlgeschlagen.' },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'E-Mail konnte nicht versendet werden.' },
      { status: 500 }
    );
  }
}
