/*
  # Enable PostGIS Extension
  
  1. Extension
    - Enable PostGIS for geographic/location data support
    - Required for storing and querying location coordinates
*/

CREATE EXTENSION IF NOT EXISTS postgis;
