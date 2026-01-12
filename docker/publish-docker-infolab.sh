source publish-appname.sh

if [ -z "$INFOLAB_VM" ]; then
    echo "Erreur: la variable d'environnement INFOLAB_VM n'est pas définie."
    exit 1
else
    SSH_PORT=52${INFOLAB_VM}
fi

cd ../publish
scp -P $SSH_PORT -r . student-admin@infolab.epfc.eu:~/$DOCKER_APP_NAME
ssh -p $SSH_PORT student-admin@infolab.epfc.eu "
    cd ~/$DOCKER_APP_NAME && 
    docker compose down --rmi all --volumes &&
    docker compose build --no-cache && 
    docker compose up -d
    "
