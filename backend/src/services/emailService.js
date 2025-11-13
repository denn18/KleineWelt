import { createConnection } from 'node:net';
import { connect as createTlsConnection } from 'node:tls';

function parseRecipients(recipients) {
  if (!recipients) {
    return [];
  }
  if (Array.isArray(recipients)) {
    return recipients.map((entry) => `${entry}`.trim()).filter((entry) => entry);
  }
  return `${recipients}`
    .split(/[,;\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    function cleanup() {
      socket.off('data', handleData);
      socket.off('error', handleError);
      socket.off('close', handleClose);
    }

    function handleError(error) {
      cleanup();
      reject(error);
    }

    function handleClose() {
      cleanup();
      reject(new Error('SMTP-Verbindung wurde unerwartet geschlossen.'));
    }

    function handleData(chunk) {
      buffer += chunk.toString('utf-8');
      const lines = buffer.split(/\r?\n/);
      for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = lines[index];
        if (/^\d{3} /.test(line)) {
          cleanup();
          const code = Number.parseInt(line.slice(0, 3), 10);
          const message = lines.filter(Boolean).join('\n');
          resolve({ code, message });
          return;
        }
      }
    }

    socket.on('data', handleData);
    socket.on('error', handleError);
    socket.on('close', handleClose);
  });
}

async function sendLine(socket, line) {
  socket.write(`${line}\r\n`);
  return readResponse(socket);
}

async function sendData(socket, data) {
  const prepared = data.replace(/\n\./g, '\n..');
  socket.write(`${prepared}\r\n.\r\n`);
  return readResponse(socket);
}

export async function sendEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || username;
  const recipients = parseRecipients(to);

  if (!host || !from || recipients.length === 0) {
    console.info('E-Mail-Benachrichtigung übersprungen – SMTP nicht konfiguriert oder Empfänger fehlt.');
    return false;
  }

  const socket = secure
    ? createTlsConnection({ host, port })
    : createConnection({ host, port });

  await new Promise((resolve, reject) => {
    const connectEvent = secure ? 'secureConnect' : 'connect';

    function handleConnect() {
      socket.off('error', handleError);
      resolve();
    }

    function handleError(error) {
      socket.off(connectEvent, handleConnect);
      reject(error);
    }

    socket.once(connectEvent, handleConnect);
    socket.once('error', handleError);
  });

  try {
    await readResponse(socket);
    await sendLine(socket, `EHLO kleinewelt.local`);

    if (username && password) {
      const authResponse = await sendLine(socket, 'AUTH LOGIN');
      if (authResponse.code !== 334) {
        throw new Error(`SMTP-Server hat AUTH LOGIN zurückgewiesen: ${authResponse.message}`);
      }

      const userResponse = await sendLine(socket, Buffer.from(username).toString('base64'));
      if (userResponse.code !== 334) {
        throw new Error(`SMTP-Server hat Benutzername nicht akzeptiert: ${userResponse.message}`);
      }

      const passResponse = await sendLine(socket, Buffer.from(password).toString('base64'));
      if (passResponse.code !== 235) {
        throw new Error(`SMTP-Server hat Passwort nicht akzeptiert: ${passResponse.message}`);
      }
    }

    const mailFromResponse = await sendLine(socket, `MAIL FROM:<${from}>`);
    if (mailFromResponse.code >= 400) {
      throw new Error(`MAIL FROM fehlgeschlagen: ${mailFromResponse.message}`);
    }

    for (const recipient of recipients) {
      const rcptResponse = await sendLine(socket, `RCPT TO:<${recipient}>`);
      if (rcptResponse.code >= 400) {
        throw new Error(`RCPT TO fehlgeschlagen (${recipient}): ${rcptResponse.message}`);
      }
    }

    const dataInitResponse = await sendLine(socket, 'DATA');
    if (dataInitResponse.code !== 354) {
      throw new Error(`DATA-Befehl fehlgeschlagen: ${dataInitResponse.message}`);
    }

    const now = new Date();
    const normalizedSubject = (subject ?? '').replace(/\r?\n/g, ' ');
    const headers = [
      `From: ${from}`,
      `To: ${recipients.join(', ')}`,
      `Subject: ${normalizedSubject}`,
      `Date: ${now.toUTCString()}`,
      'MIME-Version: 1.0',
    ];

    let body = text ?? '';

    if (html) {
      headers.push('Content-Type: text/html; charset=utf-8');
      body = html;
    } else {
      headers.push('Content-Type: text/plain; charset=utf-8');
    }

    const message = `${headers.join('\r\n')}\r\n\r\n${body}`;
    const dataResponse = await sendData(socket, message);
    if (dataResponse.code >= 400) {
      throw new Error(`Senden der Nachricht fehlgeschlagen: ${dataResponse.message}`);
    }

    await sendLine(socket, 'QUIT');
    socket.end();
    return true;
  } catch (error) {
    console.error('Versand der Benachrichtigungs-E-Mail fehlgeschlagen:', error);
    socket.end();
    return false;
  }
}
