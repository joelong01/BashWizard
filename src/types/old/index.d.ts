


declare module "frameless-titlebar2" {
    import React from "react"

    class TitleBar extends React.Component<TitleBarProps, any> {
        setKeyById(id: string, key: string, value: any): void;
        getKeyById(id: string, key: string): MenuItem;
    }
    export default TitleBar;

    export interface IMenuTheme {
        barTheme: string;
        barHeight?: string;
        winBarHeightj?: string;
        barColor?: string;
        barTitleColor?: string;
        barBackgroundColor?: string;
        barShowBorder?: string;
        titleFontFamily?: string;
        titleFontWeight?: string;
        barBorderBottom?: string;
        // should the icon be shown in the center of the toolbar on Mac/Linux apps alongside the app or title property
        showIconDarLin?: boolean;

        /* Menu */
        menuStyle?: 'horizontal' | 'vertical';
        menuDimItems?: boolean;
        menuDimOpacity?: number;
        menuDisabledOpacity?: number;
        menuWidth?: number,
        menuBackgroundColor?: string;
        menuItemTextColor?: string;
        menuItemHoverBackground?: string;
        menuActiveTextColor?: string;
        menuTextHighlightColor?: string;
        menuHighlightColor?: string;
        accentStatusIcon?: boolean;
        menuSubLabelHeaders: true,
        menuSubLabelColor?: string;
        menuAcceleratorColor?: string;
        menuShowBoxShadow?: boolean;
        menuBoxShadow?: string;
        /* Menu Overlay */
        menuOverlayBackground?: string;
        menuOverlayOpacity: number,
        menuSeparatorColor?: string;

        /* WindowControls */
        windowControlsColor?: string;
        windowCloseHover?: string;
        windowCloseBackground?: string;
        windowCloseActive?: string;
        windowDefaultBackground?: string;
        windowDefaultActive?: string;
    }

    export interface MenuItem {
        id?: string;
        type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
        label?: string;
        enabled?: string;
        visible?: boolean;
        sublabel?: string;
        accelerator?: string;
        icon?: ImageBitmapSource;
        checked?: boolean;
        submenu?: MenuItem[];
        before?: string;
        after?: string;
        click?: (menuItem: MenuItem, browerWindow: any, e: Event) => void;

    }

    export interface TitleBarProps {
        icon?: string;
        app: string;
        title?: string;
        menu: MenuItem[];
        theme?: IMenuTheme;
    }

}
