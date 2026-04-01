// src/lib/stores/toast.svelte.ts

class ToastState {
	message = $state('');
	visible = $state(false);
	private timer: ReturnType<typeof setTimeout> | null = null;

	show(msg: string, duration = 2000) {
		this.message = msg;
		this.visible = true;
		if (this.timer) clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			this.visible = false;
		}, duration);
	}
}

export const toast = new ToastState();