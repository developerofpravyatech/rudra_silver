<?php
namespace Services;

use Config\Config;

class EmailService {
    /**
     * Send password reset email to user.
     * Uses SMTP if configured, else standard PHP mail(), and logs to storage/logs/email.log.
     */
    public static function sendPasswordResetEmail(string $recipientEmail, string $recipientName, string $resetUrl): bool {
        $subject = 'Reset Your Rudra Silver Account Password';
        $htmlBody = self::renderPasswordResetTemplate($recipientName, $resetUrl);

        $fromAddress = Config::get('MAIL_FROM_ADDRESS', 'noreply@rudrasilver.com');
        $fromName    = Config::get('MAIL_FROM_NAME', 'Rudra Silver ERP');

        // Always log outgoing email for auditing and dev debugging
        self::logEmail($recipientEmail, $subject, $resetUrl);

        $mailer = strtolower(trim(Config::get('MAIL_MAILER', 'smtp')));

        if ($mailer === 'smtp') {
            return self::sendViaSmtp($recipientEmail, $recipientName, $subject, $htmlBody, $fromAddress, $fromName);
        }

        return self::sendViaPhpMail($recipientEmail, $subject, $htmlBody, $fromAddress, $fromName);
    }

    /**
     * Luxury HTML Email Template with Rudra Silver gold branding
     */
    public static function renderPasswordResetTemplate(string $name, string $resetUrl): string {
        $escapedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $escapedUrl  = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Rudra Silver</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0e14; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 540px; background-color: #111622; border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.3); overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.7);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 35px 30px 20px; background: linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(17, 22, 34, 0) 100%);">
                            <h1 style="margin: 0; font-family: 'Cinzel', Georgia, serif; font-size: 26px; font-weight: 900; letter-spacing: 4px; color: #f3c959; text-transform: uppercase;">
                                RUDRA SILVER
                            </h1>
                            <p style="margin: 4px 0 0; font-size: 11px; font-style: italic; color: rgba(243, 201, 89, 0.7); letter-spacing: 1px;">
                                Timeless Elegance, Forever Yours
                            </p>
                        </td>
                    </tr>
                    <!-- Main Body -->
                    <tr>
                        <td style="padding: 20px 35px 35px;">
                            <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff;">
                                Password Reset Request
                            </h2>
                            <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                                Hello <strong style="color: #f1f5f9;">{$escapedName}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                                We received a request to reset the password for your Rudra Silver ERP account. Click the button below to choose a new password:
                            </p>
                            <!-- CTA Button -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{$escapedUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #d4af37 0%, #f3c959 50%, #b38a1f 100%); color: #0a0c10; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.35);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.6; color: #64748b;">
                                If the button above doesn't work, copy and paste this link into your web browser:
                            </p>
                            <p style="margin: 6px 0 20px; font-size: 11px; word-break: break-all; color: #d4af37;">
                                <a href="{$escapedUrl}" style="color: #d4af37; text-decoration: underline;">{$escapedUrl}</a>
                            </p>
                            <!-- Notice -->
                            <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 12px 16px; margin-top: 25px;">
                                <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                    ⏱️ <strong>Note:</strong> This link is strictly valid for <strong>60 minutes</strong> and can only be used once. If you did not make this request, please safely disregard this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 30px; background-color: #0b0e14; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                            <p style="margin: 0; font-size: 11px; color: #475569;">
                                &copy; 2026 Rudra Silver Jewellery ERP. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Send email via direct SMTP socket connection
     */
    private static function sendViaSmtp(string $to, string $name, string $subject, string $htmlBody, string $from, string $fromName): bool {
        $host = Config::get('MAIL_HOST', 'localhost');
        $port = (int)Config::get('MAIL_PORT', 587);
        $user = Config::get('MAIL_USERNAME', '');
        $pass = Config::get('MAIL_PASSWORD', '');
        $encryption = strtolower(Config::get('MAIL_ENCRYPTION', 'tls'));

        // If no SMTP host configured, fallback to standard mail
        if (empty($host) || $host === 'localhost' || empty($user)) {
            return self::sendViaPhpMail($to, $subject, $htmlBody, $from, $fromName);
        }

        try {
            $remoteHost = ($encryption === 'ssl') ? "ssl://{$host}" : $host;
            $socket = @fsockopen($remoteHost, $port, $errno, $errstr, 10);
            if (!$socket) {
                error_log("SMTP Connection failed to {$host}:{$port} - {$errstr} ({$errno})");
                return self::sendViaPhpMail($to, $subject, $htmlBody, $from, $fromName);
            }

            self::readSmtpResponse($socket);

            fwrite($socket, "EHLO " . gethostname() . "\r\n");
            $ehloResp = self::readSmtpResponse($socket);

            if ($encryption === 'tls' && strpos($ehloResp, 'STARTTLS') !== false) {
                fwrite($socket, "STARTTLS\r\n");
                self::readSmtpResponse($socket);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fwrite($socket, "EHLO " . gethostname() . "\r\n");
                self::readSmtpResponse($socket);
            }

            if (!empty($user) && !empty($pass)) {
                fwrite($socket, "AUTH LOGIN\r\n");
                self::readSmtpResponse($socket);
                fwrite($socket, base64_encode($user) . "\r\n");
                self::readSmtpResponse($socket);
                fwrite($socket, base64_encode($pass) . "\r\n");
                self::readSmtpResponse($socket);
            }

            fwrite($socket, "MAIL FROM:<{$from}>\r\n");
            self::readSmtpResponse($socket);
            fwrite($socket, "RCPT TO:<{$to}>\r\n");
            self::readSmtpResponse($socket);
            fwrite($socket, "DATA\r\n");
            self::readSmtpResponse($socket);

            $headers = [
                "From: {$fromName} <{$from}>",
                "To: {$to}",
                "Subject: {$subject}",
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=UTF-8",
                "X-Mailer: Rudra Silver ERP Mailer"
            ];

            $data = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.\r\n";
            fwrite($socket, $data);
            self::readSmtpResponse($socket);

            fwrite($socket, "QUIT\r\n");
            fclose($socket);
            return true;
        } catch (\Throwable $e) {
            error_log("EmailService SMTP Error: " . $e->getMessage());
            return self::sendViaPhpMail($to, $subject, $htmlBody, $from, $fromName);
        }
    }

    private static function readSmtpResponse($socket): string {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return $response;
    }

    private static function sendViaPhpMail(string $to, string $subject, string $htmlBody, string $from, string $fromName): bool {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            "From: {$fromName} <{$from}>",
            "Reply-To: {$from}",
            'X-Mailer: Rudra Silver ERP Mailer'
        ];
        return @mail($to, $subject, $htmlBody, implode("\r\n", $headers));
    }

    private static function logEmail(string $recipient, string $subject, string $resetUrl): void {
        $logDir = __DIR__ . '/../storage/logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0777, true);
        }
        $logFile = $logDir . '/email.log';
        $entry = sprintf("[%s] TO: %s | SUBJECT: %s | RESET_URL: %s\n", date('Y-m-d H:i:s'), $recipient, $subject, $resetUrl);
        @file_put_contents($logFile, $entry, FILE_APPEND);
    }
}
