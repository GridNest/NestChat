import { ClientModel } from '../client/client.model';
import { ApiError } from '../../utils/apiError';
import crypto from 'crypto';

export interface WidgetScript {
  script: string;
  clientId: string;
  version: string;
  secretKey: string;
}

export interface InstallationGuide {
  platform: string;
  instructions: string;
  code: string;
}

export class WidgetGeneratorService {
  static async generateScript(clientId: string): Promise<WidgetScript> {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    const script = `<script
  src="http://localhost:5000/widget.js"
  data-client-id="${client.clientId}"
  data-api-url="http://localhost:5000/api"
  data-widget-version="${client.widgetVersion}"
  defer>
</script>`;

    return {
      script,
      clientId: client.clientId,
      version: client.widgetVersion,
      secretKey: client.widgetSecretKey,
    };
  }

  static async regenerateSecretKey(clientId: string): Promise<string> {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    client.widgetSecretKey = crypto.randomBytes(32).toString('hex');
    await client.save();

    return client.widgetSecretKey;
  }

  static async updateWidgetSettings(clientId: string, settings: {
    position?: 'bottom-right' | 'bottom-left';
    width?: string;
    height?: string;
    borderRadius?: string;
    offset?: { x: string; y: string };
    animation?: 'none' | 'slide' | 'fade';
    autoOpen?: boolean;
    autoOpenDelay?: number;
    showNotificationBadge?: boolean;
    allowLocalhost?: boolean;
  }) {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    client.widgetSettings = {
      ...client.widgetSettings,
      ...settings,
    };
    await client.save();

    return client.widgetSettings;
  }

  static async updateAllowedDomains(clientId: string, domains: string[]) {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    client.allowedDomains = domains;
    await client.save();

    return client.allowedDomains;
  }

  static async addAllowedDomain(clientId: string, domain: string) {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    if (!client.allowedDomains.includes(domain)) {
      client.allowedDomains.push(domain);
      await client.save();
    }

    return client.allowedDomains;
  }

  static async removeAllowedDomain(clientId: string, domain: string) {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    client.allowedDomains = client.allowedDomains.filter(d => d !== domain);
    await client.save();

    return client.allowedDomains;
  }

  static async getInstallationGuides(clientId: string): Promise<InstallationGuide[]> {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    const scriptTag = `<script src="http://localhost:5000/widget.js" data-client-id="${client.clientId}" data-api-url="http://localhost:5000/api" defer></script>`;

    return [
      {
        platform: 'HTML',
        instructions: 'Add the script tag before the closing </body> tag in your HTML file.',
        code: `<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content -->

  ${scriptTag}
</body>
</html>`,
      },
      {
        platform: 'React',
        instructions: 'Add the script tag in your public/index.html file, or use useEffect in a component.',
        code: `// Option 1: Add to public/index.html
// Place before closing </body> tag

// Option 2: Use in component
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'http://localhost:5000/widget.js';
    script.setAttribute('data-client-id', '${client.clientId}');
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return <div>Your App</div>;
}`,
      },
      {
        platform: 'Next.js',
        instructions: 'Add the script in your _document.js or layout.js file.',
        code: `// app/layout.js or pages/_document.js
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="http://localhost:5000/widget.js"
          data-client-id="${client.clientId}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,
      },
      {
        platform: 'WordPress',
        instructions: 'Add the script in your theme\'s footer.php file or use a plugin.',
        code: `<?php
// Add to your theme's footer.php
// Or use wp_footer hook in functions.php

function add_nestchat_widget() {
    echo '<script src="http://localhost:5000/widget.js" data-client-id="${client.clientId}" defer></script>';
}
add_action('wp_footer', 'add_nestchat_widget');
?>`,
      },
      {
        platform: 'Laravel',
        instructions: 'Add the script in your layout file (resources/views/layouts/app.blade.php).',
        code: `{{-- Add before closing </body> tag --}}
<script src="http://localhost:5000/widget.js" data-client-id="${client.clientId}" defer></script>

{{-- Or use @push directive --}}
@push('scripts')
<script src="http://localhost:5000/widget.js" data-client-id="${client.clientId}" defer></script>
@endpush`,
      },
      {
        platform: 'PHP',
        instructions: 'Add the script before the closing </body> tag in your PHP files.',
        code: `<!DOCTYPE html>
<html>
<head>
  <title>My PHP Website</title>
</head>
<body>
  <!-- Your website content -->

  <script src="http://localhost:5000/widget.js" data-client-id="${client.clientId}" defer></script>
</body>
</html>`,
      },
      {
        platform: 'Vue',
        instructions: 'Add the script in your index.html or use mounted hook in a component.',
        code: `<!-- Option 1: Add to public/index.html -->

<!-- Option 2: Use in component -->
<template>
  <div>Your App</div>
</template>

<script>
export default {
  mounted() {
    const script = document.createElement('script');
    script.src = 'http://localhost:5000/widget.js';
    script.setAttribute('data-client-id', '${client.clientId}');
    script.defer = true;
    document.body.appendChild(script);
  }
};
</script>`,
      },
      {
        platform: 'Angular',
        instructions: 'Add the script in your index.html file.',
        code: `<!-- Add to src/index.html before closing </body> -->
<script src="http://localhost:5000/widget.js" data-client-id="${client.clientId}" defer></script>`,
      },
    ];
  }

  static async getClientWidgetInfo(clientId: string) {
    const client = await ClientModel.findOne({ clientId });
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    return {
      clientId: client.clientId,
      companyName: client.companyName,
      botName: client.botName,
      logo: client.logo,
      primaryColor: client.primaryColor,
      secondaryColor: client.secondaryColor,
      widgetVersion: client.widgetVersion,
      widgetSettings: client.widgetSettings,
      allowedDomains: client.allowedDomains,
      status: client.status,
      isActive: client.isActive,
    };
  }
}
