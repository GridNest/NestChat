# NestChat Widget Integration Guide

## Overview

NestChat provides a lightweight JavaScript widget that can be embedded into any website to add live chat functionality. The widget is designed to be easy to integrate across all major frameworks and platforms. Simply add the provided script snippet to your site, configure it with your client ID, and start engaging with your visitors in real time.

## Basic Integration (HTML)

Add the following script tag to your HTML page, typically just before the closing `</body>` tag or in the `<head>` section:

```html
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://your-domain.com/widget.js';
    s.setAttribute('data-client-id', 'YOUR_CLIENT_ID');
    s.async = true;
    document.body.appendChild(s);
  })();
</script>
```

Replace `YOUR_CLIENT_ID` with the client ID provided in your NestChat admin dashboard.

## React Integration

Create a reusable component that loads the widget script on mount and cleans up on unmount:

```jsx
import { useEffect } from 'react';

export function ChatWidget({ clientId }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-client-id', clientId);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [clientId]);

  return null;
}
```

Then use the component in your application:

```jsx
<ChatWidget clientId="YOUR_CLIENT_ID" />
```

## Next.js Integration

Use the built-in `next/script` component in your `_app.js` or `layout.js` file for optimal loading:

```jsx
// In _app.js or layout.js
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script
        src="https://your-domain.com/widget.js"
        data-client-id="YOUR_CLIENT_ID"
        strategy="lazyOnload"
      />
    </>
  );
}
```

The `lazyOnload` strategy defers loading until after the page has finished its critical rendering path, minimizing any impact on page performance.

## WordPress Integration

Add the widget script to your theme by placing the following in your `functions.php` file:

```php
// In functions.php
add_action('wp_footer', 'nestchat_widget');
function nestchat_widget() {
    echo '<script>
      (function() {
        var s = document.createElement("script");
        s.src = "https://your-domain.com/widget.js";
        s.setAttribute("data-client-id", "YOUR_CLIENT_ID");
        s.async = true;
        document.body.appendChild(s);
      })();
    </script>';
}
```

Alternatively, you can add the basic HTML snippet directly into your theme's footer template file or use a plugin like **Insert Headers and Footers** to inject the script without editing theme files.

## Laravel Integration

Add the widget script to your Blade layout using a `@push` directive:

```blade
{{-- In layouts/app.blade.php --}}
@push('scripts')
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '{{ config("nestchat.widget_url") }}/widget.js';
    s.setAttribute('data-client-id', '{{ config("nestchat.client_id") }}');
    s.async = true;
    document.body.appendChild(s);
  })();
</script>
@endpush
```

Ensure that your layout file includes `@stack('scripts')` before the closing `</body>` tag. Store your configuration values in `config/nestchat.php`:

```php
return [
    'widget_url' => env('NESTCHAT_WIDGET_URL', 'https://your-domain.com'),
    'client_id' => env('NESTCHAT_CLIENT_ID', 'YOUR_CLIENT_ID'),
];
```

## Vue.js Integration

Create a single-file component that loads the widget when mounted:

```vue
<template>
  <div></div>
</template>

<script>
export default {
  name: 'ChatWidget',
  props: {
    clientId: {
      type: String,
      required: true
    }
  },
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-client-id', this.clientId);
    script.async = true;
    document.body.appendChild(script);
  }
};
</script>
```

Use the component in your application:

```vue
<ChatWidget client-id="YOUR_CLIENT_ID" />
```

## Angular Integration

Create a component that injects the widget script on initialization:

```typescript
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-chat-widget',
  template: ''
})
export class ChatWidgetComponent implements OnInit {
  ngOnInit() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.setAttribute('data-client-id', 'YOUR_CLIENT_ID');
    script.async = true;
    document.body.appendChild(script);
  }
}
```

Register the component in your app module and place `<app-chat-widget></app-chat-widget>` in your template where you want the widget to initialize.

## Widget Configuration

The widget is configured using `data-*` attributes on the script tag. The following attributes are available:

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-client-id` | Yes | — | Your unique client ID from the admin dashboard. |
| `data-position` | No | `bottom-right` | Widget position on the page. Options: `bottom-right`, `bottom-left`. |
| `data-theme` | No | `light` | Color theme for the widget. Options: `light`, `dark`. |
| `data-language` | No | `en` | Default language for the widget UI. Options: `en`, `hi`, or other supported locales. |

Example with all options:

```html
<script
  src="https://your-domain.com/widget.js"
  data-client-id="YOUR_CLIENT_ID"
  data-position="bottom-left"
  data-theme="dark"
  data-language="hi"
  async
></script>
```

## Domain Configuration

For security purposes, only whitelisted domains are allowed to load and display the widget. To add your domain:

1. Log in to the NestChat admin dashboard.
2. Navigate to **Settings > Domain Whitelist**.
3. Add the full domain (e.g., `https://example.com`) that will host the widget.
4. Save your changes.

Requests from non-whitelisted domains will be rejected and the widget will not render.

## Troubleshooting

**Widget not showing**

- Verify that your domain is whitelisted in the admin dashboard under **Settings > Domain Whitelist**.
- Check that the `data-client-id` value is correct and matches your assigned client ID.
- Open the browser console and look for any error messages returned by the widget script.

**CORS errors**

- Confirm that your domain is listed in the whitelist. CORS headers are only sent to approved origins.
- Ensure you are loading the script over the correct protocol (HTTPS).

**Script not loading**

- Verify that the script URL is correct and accessible. Try opening `https://your-domain.com/widget.js` directly in a browser.
- Check that the script tag is not being blocked by a Content Security Policy (CSP) on your page. You may need to add the widget domain to your CSP `script-src` directive.
- Confirm that the script is placed in a location where it will execute (e.g., before `</body>` or in the `<head>` with the `async` attribute).
