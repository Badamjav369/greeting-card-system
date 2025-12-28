// server.js - Complete Express Backend for Greeting Card System
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const GREETINGS_FILE = path.join(DATA_DIR, 'greetings.json');

// Email transporter setup (simulated - configure for real emails)
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email', // эсвэл Gmail, Outlook г.м.
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Initialize storage
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(GREETINGS_FILE);
    } catch {
      await fs.writeFile(GREETINGS_FILE, JSON.stringify([]));
      console.log('Created greetings.json file');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Read greetings from JSON file
async function readGreetings() {
  try {
    const data = await fs.readFile(GREETINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading greetings:', error);
    return [];
  }
}

// Write greetings to JSON file
async function writeGreetings(greetings) {
  try {
    await fs.writeFile(GREETINGS_FILE, JSON.stringify(greetings, null, 2));
  } catch (error) {
    console.error('Error writing greetings:', error);
    throw error;
  }
}

// Send email notification (simulated)
async function sendEmailNotification(greeting, isUpdate = false) {
  const action = isUpdate ? 'updated' : 'created';
  
  console.log('\n📧 EMAIL NOTIFICATION (Simulated)');
  console.log('═══════════════════════════════════');
  console.log(`To: ${greeting.senderEmail}`);
  console.log(`Subject: Your Greeting Card for ${greeting.recipientName} has been ${action}!`);
  console.log('\nMessage:');
  console.log(`Hello ${greeting.senderName},`);
  console.log(`\nYour greeting card has been successfully ${action}!`);
  console.log(`\nRecipient: ${greeting.recipientName}`);
  console.log(`Occasion: ${greeting.occasion}`);
  console.log(`\nView your greeting card at:`);
  console.log(`http://localhost:${PORT}/view.html?id=${greeting.id}`);
  console.log('═══════════════════════════════════\n');

  // For real email sending, uncomment below:
  /*
  const mailOptions = {
    from: 'Greeting Card System <noreply@greetings.com>',
    to: greeting.senderEmail,
    subject: `Your Greeting Card for ${greeting.recipientName} has been ${action}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7C3AED;">Greeting Card ${action.charAt(0).toUpperCase() + action.slice(1)}!</h2>
        <p>Hello ${greeting.senderName},</p>
        <p>Your greeting card has been successfully ${action}!</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Card Details</h3>
          <p style="margin: 5px 0;"><strong>Recipient:</strong> ${greeting.recipientName}</p>
          <p style="margin: 5px 0;"><strong>Occasion:</strong> ${greeting.occasion}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(greeting.createdAt).toLocaleDateString()}</p>
        </div>
        <p>View your greeting card at: <a href="http://localhost:${PORT}/view.html?id=${greeting.id}">Click here</a></p>
        <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">This is an automated message from the Greeting Card System.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
  */
}

// API ROUTES

// Create new greeting
app.post('/api/greetings', async (req, res) => {
  try {
    const { senderName, senderEmail, recipientName, message, occasion } = req.body;
    
    // Validation
    if (!senderName || !senderEmail || !recipientName || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email address' 
      });
    }

    const greetings = await readGreetings();
    
    const newGreeting = {
      id: `greeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim().toLowerCase(),
      recipientName: recipientName.trim(),
      message: message.trim(),
      occasion: occasion || 'birthday',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    greetings.push(newGreeting);
    await writeGreetings(greetings);
    
    // Send email notification
    await sendEmailNotification(newGreeting, false);
    
    res.status(201).json({ 
      success: true, 
      greeting: newGreeting,
      message: 'Greeting created successfully'
    });
  } catch (error) {
    console.error('Error creating greeting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create greeting' 
    });
  }
});

// Get all greetings
app.get('/api/greetings', async (req, res) => {
  try {
    const greetings = await readGreetings();
    res.json({ 
      success: true, 
      greetings,
      count: greetings.length
    });
  } catch (error) {
    console.error('Error fetching greetings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch greetings' 
    });
  }
});

// Get single greeting by ID
app.get('/api/greeting/:id', async (req, res) => {
  try {
    const greetings = await readGreetings();
    const greeting = greetings.find(g => g.id === req.params.id);
    
    if (!greeting) {
      return res.status(404).json({ 
        success: false, 
        error: 'Greeting not found' 
      });
    }
    
    res.json({ 
      success: true, 
      greeting 
    });
  } catch (error) {
    console.error('Error fetching greeting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch greeting' 
    });
  }
});

// Update greeting
app.put('/api/greeting/:id', async (req, res) => {
  try {
    const { senderName, senderEmail, recipientName, message, occasion } = req.body;
    const greetings = await readGreetings();
    
    const index = greetings.findIndex(g => g.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Greeting not found' 
      });
    }
    
    // Validation
    if (!senderName || !senderEmail || !recipientName || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    greetings[index] = {
      ...greetings[index],
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim().toLowerCase(),
      recipientName: recipientName.trim(),
      message: message.trim(),
      occasion: occasion || greetings[index].occasion,
      updatedAt: new Date().toISOString()
    };
    
    await writeGreetings(greetings);
    
    // Send email notification
    await sendEmailNotification(greetings[index], true);
    
    res.json({ 
      success: true, 
      greeting: greetings[index],
      message: 'Greeting updated successfully'
    });
  } catch (error) {
    console.error('Error updating greeting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update greeting' 
    });
  }
});

// Delete greeting
app.delete('/api/greeting/:id', async (req, res) => {
  try {
    const greetings = await readGreetings();
    const filteredGreetings = greetings.filter(g => g.id !== req.params.id);
    
    if (greetings.length === filteredGreetings.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Greeting not found' 
      });
    }
    
    await writeGreetings(filteredGreetings);
    res.json({ 
      success: true, 
      message: 'Greeting deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting greeting:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete greeting' 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'Server is running',
    timestamp: new Date().toISOString() 
  });
});

// Start server
initStorage().then(() => {
  app.listen(PORT, () => {
    console.log('\n🎉 Greeting Card System Server Started!');
    console.log('═══════════════════════════════════════');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`📝 Create Card: http://localhost:${PORT}/index.html`);
    console.log(`👀 View Cards: http://localhost:${PORT}/view.html`);
    console.log('\n📡 API Endpoints:');
    console.log('   POST   /api/greetings      - Create greeting');
    console.log('   GET    /api/greetings      - List all greetings');
    console.log('   GET    /api/greeting/:id   - Get single greeting');
    console.log('   PUT    /api/greeting/:id   - Update greeting');
    console.log('   DELETE /api/greeting/:id   - Delete greeting');
    console.log('═══════════════════════════════════════\n');
  });
});