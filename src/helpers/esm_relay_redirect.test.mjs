import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { rewriteRelayRedirectUrl } from './esm_relay_redirect.js';

const CANONICAL = 'https://esm-canonical.example.com';
const PROXY = 'https://relay.example.com/esm';

describe('rewriteRelayRedirectUrl', () => {
    it('rewrites canonical host URLs under the relay prefix', () => {
        const result = rewriteRelayRedirectUrl(
            'https://esm-canonical.example.com/DetermineMode.php',
            'https://relay.example.com/esm/authenticate.php',
            CANONICAL,
            PROXY,
        );
        assert.equal(result, 'https://relay.example.com/esm/DetermineMode.php');
    });

    it('rewrites same-proxy-host root paths missing the relay prefix', () => {
        const result = rewriteRelayRedirectUrl(
            '/Disclaimer.php?ModeName=RUO%20Mode&ModeCount=1',
            'https://relay.example.com/esm/DetermineMode.php',
            CANONICAL,
            PROXY,
        );
        assert.equal(
            result,
            'https://relay.example.com/esm/Disclaimer.php?ModeName=RUO%20Mode&ModeCount=1',
        );
    });

    it('leaves URLs already under the relay prefix unchanged', () => {
        const url = 'https://relay.example.com/esm/Records_List.php';
        assert.equal(
            rewriteRelayRedirectUrl(url, url, CANONICAL, PROXY),
            url,
        );
    });

    it('returns redirect URL unchanged when proxy base is empty', () => {
        const url = 'https://esm-canonical.example.com/Login.php';
        assert.equal(rewriteRelayRedirectUrl(url, url, CANONICAL, ''), url);
    });
});
