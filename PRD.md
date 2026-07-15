# PRD-001: Manejo de Stock — Puentes de Papel

| Campo | Detalle |
|---|---|
| **ID** | PRD-001 |
| **Producto** | Manejo de Stock "Puentes de Papel" |
| **Tipo** | Software de gestión de stock y precios para tienda de libros |
| **Usuarios** | Un único usuario / un único acceso |
| **Estado** | Borrador |

---

## 1. Resumen

Software para gestionar el stock de una tienda de libros. Permite el ABM (alta, baja y modificación) de libros, el manejo del stock y la actualización de precios de forma ágil, tanto de manera individual como mediante carga masiva a través de un archivo Excel.

---

## 2. Contexto y Problema

La tienda cuenta con **un solo usuario y un solo acceso**. Se necesita poder:

- Dar de alta los libros.
- Subir y bajar el stock de manera rápida.
- Consultar el precio de los libros de manera rápida (por búsqueda o por foto).
- Actualizar los precios de manera rápida, tanto individualmente como mediante carga masiva a través de un archivo Excel.

---

## 3. Objetivos

- Mantener el **stock actualizado**.
- Mantener los **precios actualizados**.
- **Consultar rápidamente** estos datos.

---

## 4. Requerimientos Funcionales

| ID | Requerimiento |
|---|---|
| **RF-01** | El usuario debe poder dar de alta un libro, con título, editorial, foto (opcional), cantidad en stock y precio. |
| **RF-02** | El usuario debe poder modificar el precio de un libro. |
| **RF-03** | El usuario debe poder modificar manualmente el stock de un libro. |
| **RF-04** | El usuario debe poder marcar un libro como vendido. |
| **RF-05** | El usuario debe poder subir un archivo Excel con las columnas *libro* y *precio*. |
| **RF-06** | El sistema debe actualizar el precio de todos los libros incluidos en el archivo Excel subido. |
| **RF-07** | El usuario debe poder consultar el precio de un libro buscándolo por nombre o editorial. |
| **RF-08** | El usuario debe poder consultar el precio de un libro buscándolo por foto. |
| **RF-09** | El sistema debe guardar un historial de las ventas (fecha y valor de venta). |
| **RF-10** | El sistema debe guardar un historial de los cambios de stock. |
| **RF-11** | El sistema debe guardar un historial de los cambios de precio. |
| **RF-12** | El usuario debe poder revisar los historiales de los cambios de precio y ventas. |
| **RF-13** | El usuario debe poder filtrar los historiales por fecha, título y editorial. |

---

## 5. Requerimientos No Funcionales

| ID | Requerimiento |
|---|---|
| **RNF-01** | La consulta del precio de un libro por búsqueda por nombre o editorial debe ser menor a **1 s (p95)**. |
| **RNF-02** | La consulta del precio de un libro por búsqueda por foto debe ser menor a **3 s (p95)**. |
| **RNF-03** | La persistencia de datos se implementa con SQLite (base de datos embebida en un único archivo, sin servidor). |

---

## 6. Criterios de Aceptación

| ID | Requerimientos asociados | Criterio |
|---|---|---|
| **AC-01** | RF-01 | Dado el alta de un libro, el mismo debe quedar guardado en la base de datos. |
| **AC-02** | RF-04 | Al marcar un libro como vendido, se debe descontar cantidad 1 del stock. |
| **AC-03** | RF-02, RF-03, RF-10, RF-11 | Al modificar el precio o el stock de un libro, el nuevo valor debe quedar guardado en la base de datos y el cambio debe registrarse en el historial correspondiente (precio o stock). |
| **AC-04** | RF-09, RF-10, RF-11, RF-12, RF-13 | Al solicitar un historial (ventas, stock o precios), el sistema debe mostrar sus registros con fecha y valor; al aplicar un filtro por fecha, título o editorial, sólo debe mostrar los registros que lo cumplen. |
| **AC-05** | RF-05 | Al subir un archivo Excel con las columnas *libro* y *precio*, el sistema debe aceptar el archivo y leer su contenido. |
| **AC-06** | RF-06 | Dado un archivo Excel válido subido, al procesarlo el precio de todos los libros incluidos debe quedar actualizado en la base de datos. |
| **AC-07** | RF-07 | Al buscar un libro por su nombre o editorial, el sistema debe devolver su precio. |
| **AC-08** | RF-08 | Al buscar un libro por su foto, el sistema debe devolver su precio. |

---

## 7. Fuera de Alcance

- Tienda virtual para los clientes, con opción a realizar la compra.
- Módulo de facturación (emisión de facturas, comprobantes fiscales, integración con AFIP/organismos impositivos y gestión de datos fiscales de clientes).

---

## 8. Riesgos y Dependencias

| Tipo | Descripción | Mitigación |
|---|---|---|
| **Riesgo** | Búsqueda por foto incorrecta. | Repetir la búsqueda descartando el resultado incorrecto reciente. |
| **Dependencia** | Base de datos **SQLite** (archivo local, sin servidor). | Backup periódico del archivo `.db`. |
