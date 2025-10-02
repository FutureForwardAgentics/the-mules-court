function App() {
  console.log('App component rendering');

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #1a1a2e, #6b21a8, #000000)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>The Mule's Court</h1>
        <p>React is working!</p>
        <p style={{ fontSize: '16px', marginTop: '20px', color: '#cccccc' }}>
          Check the console for logs
        </p>
      </div>
    </div>
  );
}

export default App;
