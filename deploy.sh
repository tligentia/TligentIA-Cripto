#!/bin/bash
export PATH=/opt/plesk/node/24/bin:$PATH
cd /cripto.tligent.com

echo "Instalando dependencias..."
/opt/plesk/node/24/bin/npm install --legacy-peer-deps

echo "Construyendo aplicación..."
/opt/plesk/node/24/bin/npm run build

echo "Deploy completado!"