<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const RECIPIENT = 'limreaper.ryan@gmail.com';
const SENDER = 'website@limbreaper-treesurgery.co.uk';

function respond(int $status, bool $ok, string $message): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function field(string $name, int $maxLength): string
{
    $value = trim((string) ($_POST[$name] ?? ''));
    $value = str_replace("\0", '', $value);
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $maxLength, 'UTF-8')
        : substr($value, 0, $maxLength);
}

function headerText(string $value): string
{
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

// Hidden field: bots commonly fill this in, people never see it.
if (field('website', 200) !== '') {
    respond(200, true, 'Thank you.');
}

$name = field('name', 100);
$phone = field('phone', 50);
$email = field('email', 254);
$area = field('area', 120);
$service = field('service', 120);
$message = field('message', 4000);

if ($name === '' || $phone === '') {
    respond(422, false, 'Please provide your name and phone number.');
}

if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, false, 'Please enter a valid email address.');
}

$safeArea = headerText($area ?: 'Essex / Suffolk');
$subject = 'Website enquiry - ' . $safeArea;
if (function_exists('mb_encode_mimeheader')) {
    $subject = mb_encode_mimeheader($subject, 'UTF-8');
}

$body = implode("\r\n", [
    'New enquiry from the Limb Reaper website',
    '',
    'Name: ' . headerText($name),
    'Phone: ' . headerText($phone),
    'Email: ' . ($email ?: 'Not supplied'),
    'Area / postcode: ' . ($area ?: 'Not supplied'),
    'Service: ' . ($service ?: 'Not sure'),
    '',
    'Job details:',
    $message ?: 'No additional details supplied',
]);

$headers = [
    'From: Limb Reaper Website <' . SENDER . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

if (!mail(RECIPIENT, $subject, $body, implode("\r\n", $headers))) {
    error_log('Limb Reaper contact form: PHP mail() returned false.');
    respond(500, false, 'Your enquiry could not be sent. Please call or email us.');
}

respond(200, true, 'Your enquiry has been sent.');
