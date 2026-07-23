import React from 'react';
import { ChatWidget } from './components/ChatWidget';
import { WidgetButton } from './components/WidgetButton';

function App() {
  const clientId = document.querySelector('script[data-client-id]')?.getAttribute('data-client-id');

  if (!clientId) {
    console.error('NestChat: data-client-id attribute is required');
    return null;
  }

  return (
    <>
      <ChatWidget clientId={clientId} />
      <WidgetButton />
    </>
  );
}

export default App;
