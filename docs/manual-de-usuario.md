# Manual de usuario — Arcade Escolar

Guía para las tres personas que usan el sistema: el **alumno**, el **profesor** y quien **juega en el arcade**.

Todo funciona solo estando conectado a la red (WiFi) del colegio.

---

## 1. Alumno: crear tu cuenta

1. Entrá desde el celular o la computadora a `http://10.56.31.32:8085`.
2. Tocá **Registrarse** (o entrá directo a `http://10.56.31.32:8085/registro`).
3. Completá nombre, apellido, email y contraseña. La contraseña tiene que tener al menos 8 caracteres.
4. Tocá el botón de registrarse. Listo, ya tenés cuenta.

Algunas cosas para tener en cuenta:

- El email no se puede repetir: si ya existe una cuenta con ese email, te avisa.
- Anotá el email y la contraseña, porque son los que vas a escribir en el arcade.
- Al registrarte empezás con **cero tiempo**. Para jugar, pedile a un profesor que te cargue.

---

## 2. Profesor: cargar y quitar tiempo

### Entrar al panel

1. Entrá a `http://10.56.31.32:8085`.
2. Andá a la zona de profesores. Te pide una contraseña de acceso (la misma para todos los profesores; la define el grupo que mantiene el sistema).
3. Si todavía no tenés cuenta, registrate en **Registro de profesor**. Si ya tenés, entrá con tu email y contraseña en **Iniciar sesión**.
4. Entrás a la pantalla de **Alumnos**.

La sesión dura 8 horas. Después hay que volver a entrar.

### Cargar o quitar tiempo

1. En la lista, buscá al alumno. Se ven nombre, apellido, email y el tiempo que le queda.
2. Tocá al alumno para seleccionarlo. A un costado se abre el panel de tiempo.
3. Elegí **asignar** o **quitar**, poné los minutos y confirmá.
4. El tiempo nuevo se ve enseguida en la lista.

También podés seleccionar varios alumnos a la vez para cargarles tiempo a todos juntos.

### Editar los datos de un alumno

Desde el mismo panel podés corregir el nombre, el apellido o el email de un alumno, y cambiarle la contraseña si se la olvidó. Dejá el campo de contraseña vacío si no querés cambiarla.

---

## 3. Jugar en el arcade

1. Prendé el arcade. Aparece la pantalla de inicio de sesión.
2. Con el teclado, escribí tu **email** y tu **contraseña** (los mismos con los que te registraste).
3. Si los datos están bien, entrás. En la **pantallita LCD** del arcade se ve el tiempo que te queda.
4. Elegí un juego con la **palanca** y entrá con uno de los **botones grandes**.
5. Mientras jugás, el tiempo se va descontando. Se sincroniza con el servidor cada 10 segundos.
6. Cuando el tiempo llega a cero, **el juego se cierra solo**.

Para seguir jugando, pedile a un profesor que te cargue más tiempo.

---

## 4. Problemas comunes

| Qué pasa | Qué hacer |
|---|---|
| La página no abre | Fijate que estés en el WiFi del colegio. Si seguís sin entrar, puede estar apagado el servidor: avisale al grupo que mantiene el sistema. |
| "No se pudo conectar con el servidor" | El servidor no está respondiendo. Avisale al grupo que lo mantiene. |
| En el arcade dice que los datos son incorrectos | Revisá que el email esté bien escrito y sin espacios. Si no te acordás la contraseña, pedile a un profesor que te la cambie. |
| Me registré pero no puedo jugar | Te falta que un profesor te cargue tiempo. |
| El juego se cerró de golpe | Se te acabó el tiempo. |
| La página muestra algo viejo o raro | Recargá con Ctrl + Shift + R. |
