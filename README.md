# SuiScope 🔍

A modern, responsive blockchain explorer for the Sui Network. SuiScope provides an intuitive interface to explore transactions, addresses, objects, and network statistics on the Sui blockchain.

![SuiScope Preview](https://via.placeholder.com/800x400/4FC3F7/FFFFFF?text=SuiScope+-+Sui+Network+Explorer)

## ✨ Features

- **🔍 Universal Search**: Search transactions, addresses, and objects with intelligent type detection
- **📊 Real-time Statistics**: Live network metrics including TPS, transaction count, and more
- **🔄 Recent Activity**: Stay updated with the latest transactions on the network
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🎨 Modern UI**: Clean, intuitive interface built with modern web standards
- **⚡ Fast & Lightweight**: No frameworks - pure HTML, CSS, and JavaScript
- **🌙 Dark Mode Ready**: Built-in support for dark theme preference

## 🚀 Live Demo

Visit the live application: [https://your-username.github.io/suiscope](https://your-username.github.io/suiscope)

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript (ES6+)
- **Blockchain API**: Sui Network JSON-RPC API
- **Icons**: Custom SVG icons
- **Fonts**: Inter (Google Fonts)
- **Build Tools**: None required - runs in any modern browser
- **Hosting**: GitHub Pages

## 📋 Prerequisites

- Modern web browser with JavaScript enabled
- Internet connection for blockchain API access

## 🏃‍♂️ Quick Start

### Option 1: Use GitHub Pages (Recommended)

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Visit your GitHub Pages URL

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/suiscope.git
   cd suiscope
   ```

2. **Serve locally**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have it installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

## 🔧 Configuration

### API Endpoints

The application uses the official Sui mainnet RPC endpoint by default:
```
https://fullnode.mainnet.sui.io:443
```

To change the endpoint, modify the `baseURL` in `js/api.js`:

```javascript
this.baseURL = 'your-custom-endpoint';
```

### Network Selection

Currently configured for Sui Mainnet. To switch networks:

1. Update the `baseURL` in `SuiAPI` class
2. Modify network-specific configurations as needed

## 📁 Project Structure

```
suiscope/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css            # Core styles and CSS variables
│   ├── components.css      # Component-specific styles
│   └── responsive.css      # Mobile and responsive styles
├── js/
│   ├── utils.js           # Utility functions
│   ├── api.js             # Blockchain API interface
│   ├── search.js          # Search functionality
│   └── main.js            # Main application logic
├── assets/
│   ├── favicon.svg        # Site favicon
│   └── favicon.png        # Fallback favicon
├── README.md
└── LICENSE
```

## 🎯 Usage

### Search Functionality

SuiScope supports intelligent search for various Sui blockchain entities:

- **Transactions**: Enter a 64-character transaction digest
- **Addresses**: Enter a Sui address (0x followed by 40 hex characters)
- **Objects**: Enter an object ID
- **Partial Matches**: Auto-suggests based on input

### Features Overview

1. **Network Statistics Dashboard**
   - Total transactions
   - Total objects
   - Active addresses
   - Current TPS (Transactions per second)

2. **Search & Results**
   - Real-time search suggestions
   - Filtered results by type
   - Paginated results
   - Copy-to-clipboard functionality

3. **Recent Activity Feed**
   - Latest network transactions
   - Transaction status indicators
   - Quick access to transaction details

## 🔌 API Reference

### SuiAPI Class Methods

- `search(query)` - Universal search function
- `getTransaction(digest)` - Get transaction details
- `getObject(objectId)` - Get object information
- `getOwnedObjects(address)` - Get objects owned by address
- `getBalance(address)` - Get SUI balance
- `getLatestTransactions(limit)` - Get recent transactions

### Utility Functions

- `formatNumber(num)` - Format numbers with commas
- `formatRelativeTime(timestamp)` - Convert to "X time ago"
- `truncateHash(hash)` - Shorten long hashes
- `copyToClipboard(text)` - Copy text to clipboard

## 🎨 Customization

### Theme Colors

Modify CSS custom properties in `styles/main.css`:

```css
:root {
  --primary-color: #4FC3F7;     /* Main brand color */
  --primary-dark: #0288D1;      /* Darker variant */
  --accent-color: #FF6B35;      /* Accent color */
  /* ... more variables */
}
```

### Adding New Features

1. **New Search Types**: Extend the `detectSearchType()` function in `utils.js`
2. **Additional APIs**: Add new methods to the `SuiAPI` class
3. **UI Components**: Create new CSS components in `styles/components.css`

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Use modern JavaScript (ES6+)
- Follow existing code style and naming conventions
- Test on multiple devices and browsers
- Optimize for performance and accessibility
- Update documentation for new features

## 🐛 Bug Reports & Feature Requests

Please use GitHub Issues to report bugs or request features:

- **Bug Report**: Provide steps to reproduce, expected behavior, and actual behavior
- **Feature Request**: Describe the feature and its use case

## 📈 Roadmap

### Upcoming Features

- [ ] **Transaction Details Page**: Full transaction breakdown
- [ ] **Address Dashboard**: Complete address analytics
- [ ] **Object Inspector**: Detailed object viewer
- [ ] **Network Analytics**: Charts and historical data
- [ ] **API Documentation**: Interactive API docs
- [ ] **Bookmarks**: Save frequently accessed items
- [ ] **Export Functionality**: CSV/JSON data export
- [ ] **Advanced Filters**: Complex search queries
- [ ] **Notification System**: Real-time updates

### Long-term Goals

- [ ] **Multi-network Support**: Support for devnet and testnet
- [ ] **Package Explorer**: Move package analysis
- [ ] **Validator Information**: Validator stats and details
- [ ] **DeFi Integration**: Token tracking and DeFi metrics
- [ ] **Mobile App**: Native mobile applications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sui Network** for providing robust blockchain infrastructure
- **Inter Font** by Rasmus Andersson
- **Community** for feedback and contributions

## 📞 Support

- **Documentation**: Check this README and code comments
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Join community discussions in GitHub Discussions
- **Updates**: Watch the repository for updates

---

<div align="center">

**Built with ❤️ for the Sui ecosystem**

[Report Bug](https://github.com/your-username/suiscope/issues) · [Request Feature](https://github.com/your-username/suiscope/issues) · [View Demo](https://your-username.github.io/suiscope)

</div>