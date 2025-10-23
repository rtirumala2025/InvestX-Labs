import React from 'react';

const EnvTest = () => {
  console.log('Environment Variables in Component:');
  console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '*** (key exists but hidden)' : 'Not set');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px', borderRadius: '5px' }}>
      <h3>Environment Variables Test</h3>
      <p>Check the browser console for environment variable values</p>
      <pre>
        {JSON.stringify({
          REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
          REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? '*** (set but hidden)' : 'Not set'
        }, null, 2)}
      </pre>
    </div>
  );
};

export default EnvTest;
