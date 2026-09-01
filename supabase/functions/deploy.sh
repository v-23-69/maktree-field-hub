#!/bin/bash
supabase functions deploy create-auth-user
supabase functions deploy send-push-notification --no-verify-jwt
