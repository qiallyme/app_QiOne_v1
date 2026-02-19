Mother's Care Portal - Build & Deployment Guide

This guide explains how to take the React prototype and deploy it using Vite + Supabase + Cloudflare Pages.

1. Local Project Structure

Create a folder named care-portal. Organize your files exactly like this:

care-portal/
├── public/
│   └── manifest.json          # PWA Manifest (for installability)
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   └── Layout.jsx
│   ├── lib/
│   │   └── supabase.js        # Supabase Connection Logic
│   ├── screens/
│   │   ├── Dashboard.jsx
│   │   ├── MedsScreen.jsx
│   │   ├── SuppliesScreen.jsx # (The new file)
│   │   └── AuthScreen.jsx
│   ├── App.jsx                # Main Entry
│   ├── main.jsx               # React DOM Root
│   └── index.css              # Tailwind Imports
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js


2. Dependency Setup (package.json)

Run npm init vite@latest to generate the base, then install these packages:

npm install @supabase/supabase-js lucide-react date-fns clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer


3. The Supabase Connection (src/lib/supabase.js)

This file connects your app to the database schema you just created.

import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase Project Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to log events easily
export const logEvent = async (type, title, description, user_id) => {
  const { error } = await supabase
    .from('care_timeline')
    .insert({ event_type: type, title, description, logged_by: user_id })
  
  if (error) console.error('Error logging event:', error)
}


4. Connecting the Frontend (Example)

In your App.jsx, replace the useState mock data with Supabase hooks.

Example: Fetching Oxygen Inventory

import { supabase } from './lib/supabase'

// Inside your component
useEffect(() => {
  const fetchSupplies = async () => {
    const { data } = await supabase
      .from('inventory_supplies')
      .select('*')
      .eq('item_type', 'oxygen_tank')
      .single()
    
    if (data) {
      setSupplies(prev => ({
        ...prev, 
        oxygenTanksFull: data.quantity_full, 
        oxygenTanksEmpty: data.quantity_empty
      }))
    }
  }
  
  fetchSupplies()
  
  // Real-time subscription (Updates UI instantly when another family member changes it)
  const channel = supabase
    .channel('inventory_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_supplies' }, 
        (payload) => {
           console.log('Change received!', payload)
           fetchSupplies() // Refresh data
        }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [])


5. Deployment Steps

Push to GitHub: Commit your code to a private GitHub repository.

Cloudflare Pages:

Go to Cloudflare Dashboard -> Workers & Pages -> Create Application -> Connect to Git.

Select your repo.

Build Command: npm run build

Output Directory: dist

Environment Variables: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY here.

Cloudflare Access (Security):

Go to Cloudflare Zero Trust.

Applications -> Add an Application -> Self-hosted.

Set the policy to "Allow" for emails ending in @yourfamily.com or specific email addresses.

6. How to Handle "Orders"

For the "Order More" button:

Simple Version: Use window.open('sms:SUPPLIER_NUMBER&body=Need oxygen refill').

Automated Version: Create a Supabase Edge Function or Cloudflare Worker that listens for a webhook.

When inventory_supplies < threshold, Supabase triggers the webhook.

The Worker calls the Twilio API or sends an email to the supplier.