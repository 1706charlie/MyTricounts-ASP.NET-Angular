cd ../backend
dotnet publish -c Release -o ../publish

cd ../frontend
bash -c "npm run build"

cd ../docker
cp Dockerfile ../publish
cp docker-compose.yml ../publish
cp wait-for-postgres.sh ../publish
