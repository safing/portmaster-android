export class MenuItem {
    protected isOpen: boolean;

    public show() {
        this.isOpen = true;
    }

    protected onClose() {
        this.isOpen = false;
    }
}