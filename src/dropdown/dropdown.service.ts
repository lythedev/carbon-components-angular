import { Injectable, ElementRef, OnDestroy } from "@angular/core";
import { PlaceholderService } from "./../placeholder/placeholder.module";
import { Subscription } from "rxjs";
import { position } from "@carbon/utils-position";
import { AnimationFrameService } from "./../utils/utils.module";

const defaultOffset = { top: 0, left: 0 };

@Injectable()
export class DropdownService implements OnDestroy {
	public set offset(value: { top?: number, left?: number }) {
		this._offset = Object.assign({}, defaultOffset, value);
	}

	public get offset() {
		return this._offset;
	}
	/**
	 * reference to the body appended menu
	 */
	protected menuInstance: HTMLElement;

	/**
	 * Maintains an Event Observable Subscription for the global requestAnimationFrame.
	 * requestAnimationFrame is tracked only if the `Dropdown` is appended to the body otherwise we don't need it
	 */
	protected animationFrameSubscription = new Subscription();

	protected _offset = defaultOffset;

	constructor(
		protected placeholderService: PlaceholderService,
		protected animationFrameService: AnimationFrameService
	) {}

	/**
	 * Appends the menu to the body, or a `ibm-placeholder` (if defined)
	 *
	 * @param parentRef container to position relative to
	 * @param menuRef menu to be appended to body
	 * @param classList any extra classes we should wrap the container with
	 */
	appendToBody(parentRef: HTMLElement, menuRef: HTMLElement, classList): HTMLElement {
		// build the dropdown list container
		menuRef.style.display = "block";
		const dropdownWrapper = document.createElement("div");
		dropdownWrapper.className = `dropdown ${classList}`;
		dropdownWrapper.style.width = parentRef.offsetWidth + "px";
		dropdownWrapper.style.position = "absolute";
		dropdownWrapper.appendChild(menuRef);

		// append it to the placeholder
		if (this.placeholderService.hasPlaceholderRef()) {
			this.placeholderService.appendElement(dropdownWrapper);
			// or append it directly to the body
		} else {
			document.body.appendChild(dropdownWrapper);
		}

		this.menuInstance = dropdownWrapper;

		this.animationFrameSubscription = this.animationFrameService.tick.subscribe(() => {
			this.positionDropdown(parentRef, dropdownWrapper);
		});

		return dropdownWrapper;
	}

	/**
	 * Reattach the dropdown menu to the parent container
	 * @param hostRef container to append to
	 */
	appendToDropdown(hostRef: HTMLElement): HTMLElement {
		// if the instance is already removed don't try and remove it again
		if (!this.menuInstance) { return; }
		const instance = this.menuInstance;
		const menu = instance.firstElementChild as HTMLElement;
		// clean up the instance
		this.menuInstance = null;
		menu.style.display = "none";
		hostRef.appendChild(menu);
		this.animationFrameSubscription.unsubscribe();
		if (this.placeholderService.hasPlaceholderRef() && this.placeholderService.hasElement(instance)) {
			this.placeholderService.removeElement(instance);
		} else if (document.body.contains(instance)) {
			document.body.removeChild(instance);
		}
		return instance;
	}

	/**
	 * position an open dropdown relative to the given parentRef
	 */
	updatePosition(parentRef) {
		this.positionDropdown(parentRef, this.menuInstance);
	}

	ngOnDestroy() {
		this.animationFrameSubscription.unsubscribe();
	}

	protected positionDropdown(parentRef, menuRef) {
		let pos = position.findAbsolute(parentRef, menuRef, "bottom");
		pos = position.addOffset(pos, this.offset.top, this.offset.left);
		position.setElement(menuRef, pos);
	}
}
