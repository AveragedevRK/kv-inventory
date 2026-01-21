import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jnmbqnfuouuwzkfzvunh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpubWJxbmZ1b3V1d3prZnp2dW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjExNDQsImV4cCI6MjA4MjgzNzE0NH0.D3kkMp80ll4_QnBcXB-SSZSy5M8b55nwNwfmGQnrozI";

export const supabase = createClient(supabaseUrl, supabaseKey);