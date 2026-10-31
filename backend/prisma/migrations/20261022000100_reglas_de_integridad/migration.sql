-- Reglas que Prisma no expresa en el esquema. SQL Server no tiene enums en Prisma,
-- así que los valores permitidos se garantizan con CHECK.

-- RF-02, RN-07: roles y sede asignada solo a administradores.
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_rol_ck]
  CHECK ([rol] IN (N'CLIENTE', N'ADMIN_SEDE', N'PROPIETARIO'));
ALTER TABLE [dbo].[Usuario] ADD CONSTRAINT [Usuario_sede_ck]
  CHECK (([rol] = N'ADMIN_SEDE' AND [sedeId] IS NOT NULL) OR ([rol] <> N'ADMIN_SEDE' AND [sedeId] IS NULL));

-- RF-03 a RF-06, RN-02: horarios en horas exactas.
ALTER TABLE [dbo].[Sede] ADD CONSTRAINT [Sede_horario_ck]
  CHECK ([horaApertura] LIKE N'[0-2][0-9]:00' AND [horaCierre] LIKE N'[0-2][0-9]:00' AND [horaApertura] < [horaCierre]);
ALTER TABLE [dbo].[Cancha] ADD CONSTRAINT [Cancha_deporte_ck]
  CHECK ([deporte] IN (N'FUTBOL', N'BASQUETBOL', N'VOLEIBOL'));
ALTER TABLE [dbo].[Cancha] ADD CONSTRAINT [Cancha_capacidad_ck] CHECK ([capacidad] > 0);
ALTER TABLE [dbo].[Tarifa] ADD CONSTRAINT [Tarifa_tipoDia_ck]
  CHECK ([tipoDia] IN (N'ENTRE_SEMANA', N'FIN_DE_SEMANA'));
ALTER TABLE [dbo].[Tarifa] ADD CONSTRAINT [Tarifa_valores_ck]
  CHECK ([precioHora] > 0 AND [horaInicio] < [horaFin] AND ([vigenteHasta] IS NULL OR [vigenteHasta] >= [vigenteDesde]));
ALTER TABLE [dbo].[Bloqueo] ADD CONSTRAINT [Bloqueo_rango_ck] CHECK ([fin] > [inicio]);

-- RN-03, RN-06: ciclo de vida de la reserva y política de cancelación.
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_estado_ck]
  CHECK ([estado] IN (N'PENDIENTE', N'CONFIRMADA', N'COMPLETADA', N'CANCELADA', N'EXPIRADA', N'NO_SE_PRESENTO'));
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_rango_ck] CHECK ([fin] > [inicio]);
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_precio_ck] CHECK ([precioTotal] >= 0);
ALTER TABLE [dbo].[Reserva] ADD CONSTRAINT [Reserva_reembolso_ck]
  CHECK ([porcentajeReembolso] IS NULL OR [porcentajeReembolso] BETWEEN 0 AND 100);
ALTER TABLE [dbo].[PoliticaCancelacion] ADD CONSTRAINT [PoliticaCancelacion_valores_ck]
  CHECK ([horasAntes] >= 0 AND [porcentajeReembolso] BETWEEN 0 AND 100);

-- RN-08: pagos y reembolsos.
ALTER TABLE [dbo].[Pago] ADD CONSTRAINT [Pago_estado_ck]
  CHECK ([estado] IN (N'PENDIENTE', N'CONFIRMADO', N'RECHAZADO', N'REEMBOLSADO'));
ALTER TABLE [dbo].[Pago] ADD CONSTRAINT [Pago_metodo_ck]
  CHECK ([metodo] IN (N'TARJETA_SIMULADA', N'TRANSFERENCIA', N'EFECTIVO'));
ALTER TABLE [dbo].[Pago] ADD CONSTRAINT [Pago_monto_ck] CHECK ([monto] > 0);
ALTER TABLE [dbo].[Reembolso] ADD CONSTRAINT [Reembolso_valores_ck]
  CHECK ([monto] >= 0 AND [porcentaje] BETWEEN 0 AND 100);

-- Una reserva no puede tener dos pagos activos al mismo tiempo (evita cobrar doble).
CREATE UNIQUE NONCLUSTERED INDEX [UX_Pago_ReservaActiva] ON [dbo].[Pago]([reservaId])
  WHERE [estado] IN (N'PENDIENTE', N'CONFIRMADO');

-- RF-15: estados de la cola de correos.
ALTER TABLE [dbo].[Notificacion] ADD CONSTRAINT [Notificacion_estado_ck]
  CHECK ([estado] IN (N'PENDIENTE', N'ENVIADA', N'FALLIDA'));

-- RN-01 / RNF-02: ninguna cancha puede tener dos reservas activas traslapadas.
-- El trigger rechaza el cambio aunque provenga de otro código o de una consulta manual.
EXEC(N'
CREATE TRIGGER [dbo].[Reserva_sin_traslapes] ON [dbo].[Reserva]
AFTER INSERT, UPDATE
AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (
    SELECT 1
    FROM inserted i
    JOIN [dbo].[Reserva] r
      ON r.[canchaId] = i.[canchaId]
     AND r.[id] <> i.[id]
     AND r.[estado] IN (N''PENDIENTE'', N''CONFIRMADA'')
     AND r.[inicio] < i.[fin]
     AND r.[fin] > i.[inicio]
    WHERE i.[estado] IN (N''PENDIENTE'', N''CONFIRMADA'')
  )
    THROW 51000, N''RN-01: la cancha ya tiene una reserva activa en ese horario'', 1;
END');
