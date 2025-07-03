# Docker Support

## Development
```bash
docker build -f Dockerfile.dev -t termolio:dev .
docker run -p 5173:5173 -v $(pwd):/app termolio:dev
```

## Production
```bash
docker build -f Dockerfile.prod -t termolio:prod .
docker run -p 4173:4173 termolio:prod
```
