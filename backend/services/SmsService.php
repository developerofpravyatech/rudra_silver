<?php
namespace Services;

use Config\Config;

class SmsService {
    public static function sendOtp(string $mobile, string $otp): bool {
        $cleanMobile = preg_replace('/\D/', '', $mobile);
        if (strlen($cleanMobile) > 10 && str_starts_with($cleanMobile, '91')) {
            $cleanMobile = substr($cleanMobile, 2);
        }
        $cleanMobile = strlen($cleanMobile) >= 10 ? substr($cleanMobile, -10) : $cleanMobile;

        $provider = strtoupper(trim(Config::get('SMS_PROVIDER', 'DEVELOPMENT')));
        $expireMinutes = (int)Config::get('OTP_EXPIRE_MINUTES', 5);
        $message = "<#> Your Rudra Silver verification OTP is: {$otp}. Valid for {$expireMinutes} minutes. Never share this OTP with anyone.";

        // 1. MSG91 Integration
        if ($provider === 'MSG91') {
            $authKey = Config::get('MSG91_AUTH_KEY');
            $templateId = Config::get('MSG91_TEMPLATE_ID');
            if ($authKey && $templateId) {
                $url = "https://control.msg91.com/api/v5/otp?template_id=" . urlencode($templateId) .
                       "&mobile=91" . urlencode($cleanMobile) .
                       "&authkey=" . urlencode($authKey) .
                       "&otp=" . urlencode($otp);
                
                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => 10,
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                return $httpCode === 200;
            }
        }

        // 2. Twilio Integration
        if ($provider === 'TWILIO') {
            $sid = Config::get('TWILIO_ACCOUNT_SID');
            $token = Config::get('TWILIO_AUTH_TOKEN');
            $from = Config::get('TWILIO_FROM_NUMBER');
            if ($sid && $token && $from) {
                $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";
                $postData = http_build_query([
                    'From' => $from,
                    'To'   => '+91' . $cleanMobile,
                    'Body' => $message,
                ]);

                $ch = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => $postData,
                    CURLOPT_USERPWD => "{$sid}:{$token}",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => 10,
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                return in_array($httpCode, [200, 201]);
            }
        }

        // 3. Development Fallback Mode (Console / Log)
        $logDir = __DIR__ . '/../logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0777, true);
        }
        $logLine = sprintf(
            "[%s] [SMS DEV MODE] Mobile: +91 %s | OTP: %s | Expiry: %d min\n",
            date('Y-m-d H:i:s'),
            $cleanMobile,
            $otp,
            $expireMinutes
        );
        @file_put_contents($logDir . '/sms_dev.log', $logLine, FILE_APPEND);

        error_log("======================================================================");
        error_log(" [RUDRA SILVER SMS GATEWAY — DEV / LOCAL FALLBACK]");
        error_log(" Target Mobile Number: +91 " . $cleanMobile);
        error_log(" Verification OTP Code: " . $otp);
        error_log(" Validity Window      : " . $expireMinutes . " Minutes");
        error_log("======================================================================");

        return true;
    }
}
