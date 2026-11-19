export function compatibilityMessage(message) {
    if (/LAST_LOCATION_/.test(message))
        return '上次位置不属于本入口、格式不支持或库身份已变化；请明确选择本入口工作库，未自动回退或创建。';
    if (/MODE_ROOT|SELECTION_OUTSIDE_ALLOWED_ROOT|WORKER_MODE_ROOT/.test(message))
        return '请选择本入口隔离资料根内的工作库或完整备份；未切换或读取其他入口资料。';
    if (/CREATE_HANDLE_EXPIRED|SELECTION_HANDLE_EXPIRED/.test(message))
        return '确认已取消、过期或不属于当前会话，请重新选择；未创建或切换工作库。';
    const code = message.match(/\b(C_[A-Z0-9_]+)\b/)?.[1];
    if (!code) {
        if (/locked|\bBUSY\b/i.test(message))
            return '检查未完成：工作库正在占用或存在未决操作，未授予新的编辑权限。';
        if (/FORMAL_IDENTITY|LIBRARY_IDENTITY|IDENTITY_OR_VERSION/.test(message))
            return '库身份或元资料不一致；未打开或初始化空库。';
        if (/TREE_DEPTH|REQUEST_SIZE|SIZE_LIMIT/.test(message))
            return '超过既有深度或体积限制；检查未完成。';
        return message;
    }
    const axes = { IDENTITY_FORMAT: '库身份格式', IDENTITY: '库容器', DATABASE: 'SQLite schema', DTO: '核心 DTO', POSE_RECORD: '姿势记录格式', POSE: '姿势 schema', COMPLETE: '备份 complete', SCENE: '场景格式', EMBEDDED: '内嵌格式' };
    const axis = Object.keys(axes).sort((a, b) => b.length - a.length).find(a => code.endsWith('_' + a));
    const name = axis ? axes[axis] : '数据';
    if (code === 'C_LEGACY_REVIEW_REQUIRED')
        return '旧DTO已识别；本入口仅支持DTO4／Scene2，不支持DTO1／2／3，不提供转换。未授予编辑或升级写入权限。';
    if (code.startsWith('C_VERSION_MISSING_'))
        return name + '缺少必要版本声明；不能当作旧版本或空库打开。';
    if (code.startsWith('C_VERSION_TYPE_'))
        return name + '版本字段类型不正确；未授予编辑或另存权限。';
    if (code.startsWith('C_VERSION_UNSUPPORTED_'))
        return name + '版本尚不支持；保留原输入，未以空库替代。';
    if (code === 'C_UNKNOWN_FIELD')
        return '包含当前格式不认识的字段；已在恢复工作区前拒绝，未删键或另存。';
    if (code === 'C_MIXED_DTO' || code === 'C_MIXED_MEDIA' || code === 'C_MIXED_SCENE')
        return '声明版本与数据结构混合；未补空集合或授予编辑权限。';
    if (code === 'C_SQL_STRUCTURE_UNREVIEWED')
        return '数据库包含未审定的表、列或索引等结构；未自动迁移。';
    if (code.startsWith('C_CHECK_INCOMPLETE'))
        return '检查未完成：资料可能正被占用、已变化或有未处理sidecar。请保留原文件，退出后重新选择。';
    if (code === 'C_DATABASE_CORRUPT' || code === 'C_CONTENT_CORRUPT')
        return '数据库或JSON内容损坏；未打开、未初始化空库。';
    if (code === 'C_RESOURCE_LIMIT')
        return '超过现有业务资源限制；检查未完成，未放宽限制。';
    if (code === 'C_STRUCTURE_INVALID')
        return '数据结构不完整或类型不正确；未删字段、补空集合或另存。';
    if (code === 'C_SOURCE_EVIDENCE_INVALID')
        return '应用来源证据缺失或不一致；未重新签发或替换来源。';
    if (code === 'C_IDENTITY_MISMATCH')
        return '库身份或作用域不一致；未切换工作库。';
    if (code.startsWith('C_MEDIA') || code === 'C_REFERENCE_INVALID')
        return '登记媒体或引用校验失败；保留原输入，可使用既有只读诊断查看。';
    return '格式检查未完成；未授予编辑权限。' + code;
}
