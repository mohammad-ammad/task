export interface LogContext {
    logger?: string;
    function?: string;
    workspaceId?: string;
    errorStack?: string;
    data?: any;
}