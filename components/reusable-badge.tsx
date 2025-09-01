import { Badge } from "@/components/ui/badge";
import React, { type ReactNode } from "react";
import {cn} from "@/lib/utils";

type ReusableBadgeProps = {
    children: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
    badgeClassName?: string;
};

const ReusableBadge: React.FC<ReusableBadgeProps> = ({ children, icon, className = "", badgeClassName = "" }) => {
    return (
        <div className={cn("inline-flex items-center justify-center p-1 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl mb-2", className)}>
            <Badge className={cn("bg-gradient-to-r h-6 from-amber-500 to-yellow-600 text-white border-0 px-4 py-2 text-sm font-medium shadow-lg", badgeClassName)}>
                {icon && <icon className="mr-2 h-4 w-4 text-white" />}
                {children}
            </Badge>
        </div>
    );
};

export default ReusableBadge;
