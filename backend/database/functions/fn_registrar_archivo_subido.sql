CREATE OR REPLACE FUNCTION fn_registrar_archivo_subido(
    p_id_usuario INTEGER,
    p_nombre_original VARCHAR,
    p_nombre_s3 VARCHAR,
    p_bucket_entrada VARCHAR,
    p_bucket_limpio VARCHAR,
    p_bucket_cuarentena VARCHAR,
    p_estado VARCHAR,
    p_resultado_escaneo TEXT,
    p_tamano_bytes BIGINT,
    p_tipo_mime VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    v_id_archivo INTEGER;
    v_usuario_existe BOOLEAN;
    v_archivo_existe BOOLEAN;
BEGIN
    -- 1. Validar que exista el usuario
    SELECT EXISTS(SELECT 1 FROM usuario WHERE id_usuario = p_id_usuario) INTO v_usuario_existe;
    IF NOT v_usuario_existe THEN
        RAISE EXCEPTION 'El usuario no existe.';
    END IF;

    -- 2. Validar que p_nombre_original no sea nulo ni vacio
    IF p_nombre_original IS NULL OR TRIM(p_nombre_original) = '' THEN
        RAISE EXCEPTION 'El nombre original del archivo es obligatorio.';
    END IF;

    -- 3. Validar que p_nombre_s3 no sea nulo ni vacio
    IF p_nombre_s3 IS NULL OR TRIM(p_nombre_s3) = '' THEN
        RAISE EXCEPTION 'El nombre S3 del archivo es obligatorio.';
    END IF;

    -- 4. Validar que el mismo usuario no tenga ya un archivo con el mismo nombre_original
    SELECT EXISTS(SELECT 1 FROM mis_guardados WHERE id_user = p_id_usuario AND nombre_ori = p_nombre_original AND estado NOT IN ('ELIMINADO', 'ERROR_S3')) INTO v_archivo_existe;
    IF v_archivo_existe THEN
        RAISE EXCEPTION 'Ya existe un archivo con ese nombre. Cambie el nombre del archivo.';
    END IF;

    -- 5. Insertar en mis_guardados
    INSERT INTO mis_guardados (
        id_user,
        nombre_ori,
        s3_key,
        bucket_entrada,
        bucket_limpio,
        bucket_cuarentena,
        estado,
        resultado_escaneo,
        tamano_bytes,
        tipo_mime
    ) VALUES (
        p_id_usuario,
        p_nombre_original,
        p_nombre_s3,
        p_bucket_entrada,
        p_bucket_limpio,
        p_bucket_cuarentena,
        p_estado,
        p_resultado_escaneo,
        p_tamano_bytes,
        p_tipo_mime
    ) RETURNING id_mg INTO v_id_archivo;

    -- 6. Retornar el id_archivo generado
    RETURN v_id_archivo;
END;
$$ LANGUAGE plpgsql;
