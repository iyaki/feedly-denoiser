# Feedly Denoiser

Filtrado de artículos en [Feedly](https://feedly.com/) (recopilador de noticias
mediante RSS) mediante listas utilizando su
[API REST](https://developer.feedly.com/)

## Introducción

Feedly Denoiser es una utilidad para marcar automáticamente como leídos
artículos en [Feedly](https://feedly.com/).

El filtrado se basa en comparar el título y contenido de los artículos contra
los términos registrados en 3 listas: blackList, whiteList y blackestList.

El funcionamiento es el siguiente:

- blackList: Contiene los términos a eliminar. Si hay coincidencias en algún
  artículo con el contenido de blackList el articulo será marcado como leído.
- whiteList: Si un artículo contiene términos presentes en esta lista NO será
  marcado como leído a pesar de que contenga términos presentes en blackList.
- blackesList: Si un artículo contiene términos presentes en esta lista será
- marcado como leído, sin importar las demás listas.

## Instrucciones de uso

### Instalación

Feedly-denoiser se instala mediante git:

```shell
git clone https://github.com/iyaki/feedly-denoiser.git

npm install --save-exact
```

#### Dependencias

Para funcionar, feedly-denoiser requiere [Node.js[(https://nodejs.org/es)] y
[npm](https://nodejs.org/es/docs/meta/topics/dependencies#npm).

Personalmente, recomiendo instalar Node.js utilizando algún gestor de versiones
como [nvm](https://github.com/nvm-sh/nvm) o
[asdf version manager](https://asdf-vm.com/).

Este proyecto fue desarrollado utilizando Node.js en su versión 18.16.0.
Desconozco su compatibilidad con otras versiones.

### Configuración

La herramienta se configura mediante variables de entorno o un archivo .en
situado en el directorio raíz del proyecto.

Para que funcione correctamente deben configurarse las siguientes variables:

- CLIENT_SECRET: Debe contener un [Developer Access Token](https://developer.feedly.com/v3/developer/)
  de Feedly. Se consigue desde [aquí](https://feedly.com/v3/auth/dev).
- COLLECTION: ID de la colección de Feedly que se desea filtrar.

Pueden obtener una lista de los IDs de sus colecciones utilizando el siguiente
curl:

```shell
curl --request GET \
  --url https://cloud.feedly.com/v3/collections \
  --header 'Authorization: Bearer YourAccessToken'
```

### Ejecución

```shell
./denoise.sh path_to_blacklist.json path_to_whitelist.json path_to_blackestlist.json
```

#### Automatización

Es posible automatizar la ejecución de feedly-denoiser mediante distintas
técnicas.

En el repositorio [feedly-denoiser-automation](https://github.com/iyaki/feedly-denoiser-automation)
puede encontrarse un ejemplo de automatización utilizando
[Github Actions](https://github.com/features/actions).
