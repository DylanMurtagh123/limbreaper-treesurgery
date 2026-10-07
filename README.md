# Limb Reaper Tree Surgery — 20i deployment

This is a static HTML website with a small PHP contact-form handler for standard 20i Linux/PHP hosting. It has no Composer, SMTP, Brevo, Docker or database dependency.

## Upload

1. Create a Linux/PHP hosting package for `limbreaper-treesurgery.co.uk` in My20i.
2. Upload the contents of this folder to the package's public web root (normally `public_html`). Do not upload the enclosing folder itself.
3. Use the package's temporary URL to check the pages and submit both forms before changing the domain nameservers.
4. Once tested, point the domain to 20i using the nameservers shown in My20i.

## Contact forms

Both forms submit to `contact-handler.php`, which uses 20i's PHP `mail()` service.

- Recipient: `limreaper.ryan@gmail.com`
- Sender: `website@limbreaper-treesurgery.co.uk`
- Reply-To: the visitor's submitted email address, when supplied

No mailbox or SMTP password is required for this configuration. The sender domain must be assigned to the 20i hosting package. The handler includes required-field validation, email validation, length limits, header-injection protection and a hidden spam trap.

After the domain is live, submit both forms and confirm delivery with the recipient. Check Spam during the first tests. If PHP mail delivery proves unreliable, the handler can later be upgraded to authenticated 20i SMTP without changing either HTML form.
