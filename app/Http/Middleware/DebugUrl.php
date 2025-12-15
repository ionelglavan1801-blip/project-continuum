<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DebugUrl
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        \Log::info('Debug URL', [
            'scheme' => $request->getScheme(),
            'host' => $request->getHost(),
            'schemeAndHttpHost' => $request->getSchemeAndHttpHost(),
            'url_root' => url('/'),
            'headers' => [
                'X-Forwarded-Proto' => $request->header('X-Forwarded-Proto'),
                'X-Forwarded-Host' => $request->header('X-Forwarded-Host'),
                'X-Forwarded-Port' => $request->header('X-Forwarded-Port'),
            ]
        ]);

        return $next($request);
    }
}
