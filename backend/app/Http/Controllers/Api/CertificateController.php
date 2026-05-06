<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    // Listar certificados del estudiante
    public function index(Request $request): JsonResponse
{
    $user = $request->user()->load('plan');
    
    $certificates = Certificate::where('user_id', $user->id)
    ->with(['course.category', 'course.instructor', 'user.plan'])
    ->orderBy('issued_at', 'desc')
    ->get();
    return response()->json([
        'certificates' => $certificates,
        'user_plan'    => $user->plan?->type ?? 'basic',
    ]);
}

    // Descargar certificado en PDF
  public function download(Request $request, Certificate $certificate): Response
{
    // Autenticar por query param si no hay header
    if ($request->query('token')) {
        $tokenModel = \Laravel\Sanctum\PersonalAccessToken::findToken($request->query('token'));
        if (!$tokenModel) abort(403);
        $user = $tokenModel->tokenable;
    } else {
        $user = $request->user();
    }

    if (!$user || $certificate->user_id !== $user->id) {
        abort(403);
    }

    $certificate->load(['user', 'course.instructor', 'course.category']);
    $course = $certificate->course;
    $plan   = $user->plan;

    $certType = match($plan?->type) {
        'premium' => 'premium',
        'pro'     => 'pro',
        default   => 'basic',
    };

    $html = $this->generateCertificateHtml($certType, $user, $course, $certificate);

    $pdf = Pdf::loadHTML($html)
        ->setPaper('a4', 'landscape')
        ->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => false,
            'defaultFont'          => 'sans-serif',
        ]);

    $filename = 'certificado-' . $certificate->certificate_code . '.pdf';

    return $pdf->download($filename);
}

    private function generateCertificateHtml(string $type, $user, $course, $certificate): string
    {
        $issuedAt    = $certificate->issued_at->format('d \d\e F \d\e Y');
        $code        = $certificate->certificate_code;
        $studentName = strtoupper($user->name);
        $courseName  = $course->title;
        $instructor  = $course->instructor?->name ?? 'Instructor';
        $category    = $course->category?->name ?? '';

        return match($type) {
            'premium' => $this->premiumTemplate($studentName, $courseName, $instructor, $category, $issuedAt, $code),
            'pro'     => $this->proTemplate($studentName, $courseName, $instructor, $category, $issuedAt, $code),
            default   => $this->basicTemplate($studentName, $courseName, $instructor, $category, $issuedAt, $code),
        };
    }

private function basicTemplate($student, $course, $instructor, $category, $date, $code): string
{
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; width: 297mm; height: 210mm; overflow: hidden; }
  .cert { width: 297mm; height: 210mm; background-color: #ffffff; padding: 15mm 20mm; border: 3px solid #4F46E5; }
  .border-inner { position: absolute; top: 8mm; left: 8mm; right: 8mm; bottom: 8mm; border: 1px solid #CBD5E1; }
  .header { text-align: center; margin-bottom: 5mm; }
  .logo { font-size: 26pt; font-weight: bold; color: #4F46E5; letter-spacing: 2px; }
  .logo-accent { color: #06B6D4; }
  .subtitle { font-size: 9pt; color: #64748B; letter-spacing: 4px; text-transform: uppercase; margin-top: 1mm; }
  .divider-wrap { text-align: center; margin: 4mm 0; }
  .divider { display: inline-block; width: 60mm; height: 2px; background-color: #4F46E5; }
  .title { font-size: 12pt; color: #64748B; text-align: center; letter-spacing: 2px; text-transform: uppercase; }
  .student { font-size: 28pt; color: #1E293B; text-align: center; font-weight: bold; margin: 3mm 0; }
  .desc { font-size: 10pt; color: #475569; text-align: center; margin: 2mm 0; }
  .course { font-size: 18pt; color: #4F46E5; text-align: center; font-weight: bold; margin: 2mm 0; }
  .category { font-size: 8pt; color: #94A3B8; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
  .footer-table { width: 100%; margin-top: 8mm; }
  .sig-line { width: 50mm; height: 1px; background-color: #1E293B; margin-bottom: 2mm; }
  .sig-name { font-size: 9pt; font-weight: bold; color: #1E293B; }
  .sig-role { font-size: 8pt; color: #94A3B8; }
  .code { font-size: 7pt; color: #CBD5E1; text-align: center; }
</style>
</head>
<body>
<div class="cert">
  <div class="header">
    <div class="logo">ACADE<span class="logo-accent">MIX</span></div>
    <div class="subtitle">Plataforma de educacion online</div>
  </div>
  <div class="divider-wrap"><div class="divider"></div></div>
  <div class="title">Certificado de finalizacion</div>
  <div class="student">$student</div>
  <div class="desc">ha completado satisfactoriamente el curso</div>
  <div class="course">$course</div>
  <div class="category">$category</div>
  <table class="footer-table">
    <tr>
      <td style="width:33%; text-align:center;">
        <div class="sig-line"></div>
        <div class="sig-name">$instructor</div>
        <div class="sig-role">Instructor del curso</div>
      </td>
      <td style="width:33%; text-align:center;">
        <div class="code">Codigo: $code</div>
        <div class="code">Emitido el $date</div>
      </td>
      <td style="width:33%; text-align:center;">
        <div class="sig-line"></div>
        <div class="sig-name">Academix</div>
        <div class="sig-role">Plataforma educativa</div>
      </td>
    </tr>
  </table>
</div>
</body>
</html>
HTML;
}
 private function proTemplate($student, $course, $instructor, $category, $date, $code): string
{
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; width: 297mm; height: 210mm; overflow: hidden; }
  .cert { width: 297mm; height: 210mm; background-color: #1a1a6e; position: relative; padding: 12mm 18mm; }
  .accent-bar { width: 100%; height: 3mm; background-color: #06B6D4; margin-bottom: 6mm; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4mm; }
  .logo { font-size: 22pt; font-weight: bold; color: #ffffff; letter-spacing: 3px; }
  .logo-accent { color: #06B6D4; }
  .plan-badge { background-color: #F59E0B; color: #ffffff; padding: 1mm 5mm; border-radius: 5mm; font-size: 8pt; font-weight: bold; }
  .title { font-size: 10pt; color: #a0aec0; text-align: center; letter-spacing: 4px; text-transform: uppercase; margin: 2mm 0 1mm; }
  .student { font-size: 28pt; color: #ffffff; text-align: center; font-weight: bold; margin: 2mm 0; }
  .desc { font-size: 10pt; color: #a0aec0; text-align: center; }
  .course { font-size: 17pt; color: #06B6D4; text-align: center; font-weight: bold; margin: 2mm 0; }
  .category { font-size: 8pt; color: #718096; text-align: center; letter-spacing: 2px; text-transform: uppercase; }
  .divider-wrap { text-align: center; margin: 3mm 0; }
  .divider { display: inline-block; width: 80mm; height: 1px; background-color: #4a5568; }
  .footer-table { width: 100%; margin-top: 5mm; }
  .sig-line { width: 45mm; height: 1px; background-color: #4a5568; margin-bottom: 2mm; }
  .sig-name { font-size: 8pt; font-weight: bold; color: #ffffff; }
  .sig-role { font-size: 7pt; color: #718096; }
  .code { font-size: 7pt; color: #4a5568; text-align: center; }
</style>
</head>
<body>
<div class="cert">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="logo">ACADE<span class="logo-accent">MIX</span></div>
    <div class="plan-badge">PRO CERTIFICATE</div>
  </div>
  <div class="title">Certificado de excelencia</div>
  <div class="student">$student</div>
  <div class="desc">ha completado con distincion el curso</div>
  <div class="course">$course</div>
  <div class="category">$category</div>
  <div class="divider-wrap"><div class="divider"></div></div>
  <table class="footer-table">
    <tr>
      <td style="width:33%; text-align:center;">
        <div class="sig-line"></div>
        <div class="sig-name">$instructor</div>
        <div class="sig-role">Instructor del curso</div>
      </td>
      <td style="width:33%; text-align:center;">
        <div class="code">Codigo: $code</div>
        <div class="code">Emitido el $date</div>
      </td>
      <td style="width:33%; text-align:center;">
        <div class="sig-line"></div>
        <div class="sig-name">Academix</div>
        <div class="sig-role">Plataforma educativa</div>
      </td>
    </tr>
  </table>
</div>
</body>
</html>
HTML;
}

private function premiumTemplate($student, $course, $instructor, $category, $date, $code): string
{
    return <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: sans-serif; width: 297mm; height: 210mm; overflow: hidden; }
  .cert { width: 297mm; height: 210mm; background-color: #FAFAF8; position: relative; padding: 14mm 20mm; }
  .flag-top { width: 100%; height: 4mm; position: absolute; top: 0; left: 0; }
  .flag-bottom { width: 100%; height: 4mm; position: absolute; bottom: 0; left: 0; }
  .flag-cell { display: inline-block; width: 33.33%; height: 4mm; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3mm; margin-top: 3mm; }
  .logo { font-size: 20pt; font-weight: bold; color: #1E293B; letter-spacing: 2px; }
  .logo-accent { color: #4F46E5; }
  .seal { border: 2px solid #C9A84C; border-radius: 50%; width: 18mm; height: 18mm; text-align: center; line-height: 18mm; font-size: 8pt; font-weight: bold; color: #92400E; background-color: #FEF3C7; }
  .official-bar { text-align: center; font-size: 7pt; color: #92400E; letter-spacing: 2px; text-transform: uppercase; border-top: 1px solid #C9A84C; border-bottom: 1px solid #C9A84C; padding: 1mm 0; margin-bottom: 2mm; }
  .title { font-size: 10pt; color: #64748B; text-align: center; letter-spacing: 3px; text-transform: uppercase; margin: 2mm 0 1mm; }
  .student { font-size: 26pt; color: #1E293B; text-align: center; font-weight: bold; margin: 2mm 0; font-style: italic; }
  .desc { font-size: 10pt; color: #475569; text-align: center; }
  .course { font-size: 16pt; color: #2D2D7B; text-align: center; font-weight: bold; margin: 2mm 0; }
  .category { font-size: 8pt; color: #94A3B8; text-align: center; letter-spacing: 2px; text-transform: uppercase; }
  .bolivia { font-size: 8pt; color: #92400E; text-align: center; margin: 2mm 0; font-style: italic; }
  .divider-wrap { text-align: center; margin: 2mm 0; }
  .divider { display: inline-block; width: 100mm; height: 1px; background-color: #C9A84C; }
  .footer-table { width: 100%; margin-top: 3mm; }
  .sig-line { width: 45mm; height: 1px; background-color: #1E293B; margin-bottom: 2mm; }
  .sig-name { font-size: 8pt; font-weight: bold; color: #1E293B; }
  .sig-role { font-size: 7pt; color: #94A3B8; }
  .cert-num { font-size: 8pt; color: #C9A84C; font-weight: bold; text-align: center; }
  .code { font-size: 7pt; color: #CBD5E1; text-align: center; }
</style>
</head>
<body>
<div class="cert">
  <table class="flag-top" style="position:absolute;top:0;left:0;width:100%;height:4mm;border-collapse:collapse;">
    <tr>
      <td style="background-color:#D52B1E;width:33%;height:4mm;"></td>
      <td style="background-color:#F9E300;width:34%;height:4mm;"></td>
      <td style="background-color:#007A3D;width:33%;height:4mm;"></td>
    </tr>
  </table>
  <table style="position:absolute;bottom:0;left:0;width:100%;height:4mm;border-collapse:collapse;">
    <tr>
      <td style="background-color:#D52B1E;width:33%;height:4mm;"></td>
      <td style="background-color:#F9E300;width:34%;height:4mm;"></td>
      <td style="background-color:#007A3D;width:33%;height:4mm;"></td>
    </tr>
  </table>

  <div class="header">
    <div class="logo">ACADE<span class="logo-accent">MIX</span></div>
    <div class="seal">AVAL<br>OFICIAL</div>
  </div>

  <div class="official-bar">Estado Plurinacional de Bolivia — Certificacion Oficial</div>
  <div class="title">Certificado de competencia</div>
  <div class="student">$student</div>
  <div class="desc">ha demostrado competencia y excelencia academica en</div>
  <div class="course">$course</div>
  <div class="category">$category</div>
  <div class="bolivia">Avalado por el Estado Plurinacional de Bolivia</div>
  <div class="divider-wrap"><div class="divider"></div></div>

  <table class="footer-table">
    <tr>
      <td style="width:33%; text-align:center;">
        <div class="sig-line"></div>
        <div class="sig-name">$instructor</div>
        <div class="sig-role">Instructor certificado</div>
      </td>
      <td style="width:33%; text-align:center;">
        <div class="cert-num">N. $code</div>
        <div class="code">Emitido el $date</div>
        <div class="code">Academix - Bolivia</div>
      </td>
      <td style="width:33%; text-align:center;">
        <div class="sig-line"></div>
        <div class="sig-name">Academix</div>
        <div class="sig-role">Director academico</div>
      </td>
    </tr>
  </table>
</div>
</body>
</html>
HTML;
}
}