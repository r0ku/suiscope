# SuiScope 🔍

A simple, lightweight tool to search Sui blockchain data across all networks (mainnet, testnet, devnet) and view results in popular external explorers.

## ✨ What it does

- **🔍 Smart Input Detection**: Automatically detects if you entered a transaction hash, address, or object ID
- **🌐 Multi-Network Search**: Searches across mainnet, testnet, and devnet simultaneously  
- **🔗 External Explorer Integration**: Shows results from SuiScan and SuiVision
- **⚡ One-Click Access**: Click any result to open it directly in that explorer
- **📱 Mobile Responsive**: Works perfectly on all devices

## 🚀 Live Demo

**https://r0ku.github.io/suiscope/**

## How to Use

1. **Enter your query**: Transaction hash, address, or object ID
2. **Auto-detection**: The tool automatically detects what type of data you entered
3. **View results**: See links for both SuiScan and SuiVision across all networks
4. **Click to explore**: Click any result to open it in that specific explorer

### Supported Input Formats

| Type | Format | Example |
|------|--------|---------|
| **Transaction Hash** | 64 hex characters | `a1b2c3d4e5f6...` |
| **Address** | 0x + 40 hex characters | `0x1a2b3c4d5e6f...` |
| **Object ID** | 0x + hex characters | `0x2a3b4c5d6e7f...` |

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **External APIs**: Links to SuiScan.xyz and SuiVision.xyz
- **Hosting**: GitHub Pages
- **No build tools required** - runs in any modern browser

## 🏃‍♂️ Quick Start

### Option 1: Use Online (Recommended)
Just visit: **https://r0ku.github.io/suiscope/**

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/r0ku/suiscope.git
cd suiscope

# Serve locally (pick one)
python -m http.server 8000    # Python 3
npx http-server              # Node.js
php -S localhost:8000        # PHP

# Open http://localhost:8000
```

## 📁 Project Structure

```
suiscope/
├── index.html          # Main HTML file
├── styles/
│   └── main.css       # All styles (responsive + dark mode)
├── js/
│   └── main.js        # Core application logic
├── assets/
│   └── favicon.svg    # Site icon
└── README.md
```

## 🎯 Features

### Input Detection
- **Smart Type Detection**: Automatically identifies transaction hashes, addresses, and object IDs
- **Real-time Feedback**: Shows detected type as you type
- **Format Validation**: Warns about incomplete or invalid inputs

### Multi-Network Support
- **Mainnet**: Production Sui network
- **Testnet**: Testing environment
- **Devnet**: Development network

### External Explorer Integration
- **SuiScan**: Popular Sui blockchain explorer
- **SuiVision**: Alternative Sui explorer with different features
- **Direct Links**: One-click access to specific pages

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Dark Mode**: Automatic dark mode support
- **Fast Loading**: Minimal dependencies, loads instantly

## 🔧 Customization

### Adding New Explorers

Edit `js/main.js` and add to the `explorers` array:

```javascript
{
    name: 'NewExplorer',
    domain: 'newexplorer.com',
    mainnet: 'https://newexplorer.com/mainnet',
    testnet: 'https://newexplorer.com/testnet', 
    devnet: 'https://newexplorer.com/devnet'
}
```

### Modifying URL Patterns

Update the `buildExplorerURL` method to handle different URL structures for new explorers.

## 🤝 Contributing

1. **Fork the repository**
2. **Create your feature branch**: `git checkout -b feature/new-explorer`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit**: `git commit -m 'Add NewExplorer support'`
6. **Push**: `git push origin feature/new-explorer`
7. **Open a Pull Request**

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/r0ku/suiscope/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/r0ku/suiscope/discussions)

## 📋 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Firefox Mobile
- **Requirements**: JavaScript enabled, modern CSS support

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **SuiScan.xyz** - Comprehensive Sui blockchain explorer
- **SuiVision.xyz** - Alternative Sui explorer
- **Sui Network** - The blockchain platform

---

<div align="center">

**Simple. Fast. Reliable.**

[🔍 Try SuiScope](https://r0ku.github.io/suiscope/) | [Report Bug](https://github.com/r0ku/suiscope/issues) | [Request Feature](https://github.com/r0ku/suiscope/issues)

</div>