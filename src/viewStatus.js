Module.add('viewStatus',function() {
	
class ViewStatus extends ViewObserver {
	constructor(divId) {
		super();
		this.divId = divId;
		$(this.divId).empty();
		this.slotList = [];
		this.slotMax = 10;
	}

	message(msg,payload) {
		super.message(msg,payload);
		if( msg=='show' ) {
			let div = this.slotList.find( div => div.entityId==payload.id );
			if( div ) {
				$(div).addClass('isSelected');
			}
		}
		if( msg=='hide' ) {
			$('.health-bar').removeClass( 'isSelected' );
		}
	}

	render() {


		function showHealthBar(id,newValue,lastValue,total,label,backgroundColor) {
			let hBar = $(id);
			let bar = hBar.find(' .bar');
			let hit = hBar.find(' .hit');

			let damage = lastValue - newValue;
			// calculate the percentage of the total width
			var barWidth = Math.min(100,(newValue / total) * 100);
			var hitWidth = Math.min(100,(damage / lastValue) * 100) + "%";

			// show hit bar and set the width
			bar.text('  '+label);
			hit.css('width', hitWidth);
			hBar.data('value', newValue);
			bar.css('background-color', backgroundColor);

			setTimeout(function(){
				hit.css({'width': '0'});
				bar.css('width', barWidth + "%");
			}, 500);
		}

		let observer = this.observer;
		let entityList = observer.area.entityList;

		// We both exclude and then prepend the observer to make sure the observer is first in the list.
		let f = new Finder(entityList,observer).isAlive().exclude(observer).prepend(observer)
				.canPerceiveEntity().filter(e=>e.id==observer.id || e.inCombat()).byDistanceFromMe().keepTop(this.slotMax);

		// Remove unused slots.
		Array.filterInPlace( this.slotList, slot => {
			if( !f.includesId( slot.entityId ) ) {
				$(slot).remove();
				return false;
			}
			return true;
		});

		// Add new slots
		let self = this;
		f.forEach( entity => {
			if( !self.slotList.find( div => div.entityId==entity.id ) ) {
				let div = $(
					'<div class="health-bar" data-total="1000" data-value="1000">'+
					'<div class="bar"><div class="hit"></div></div>'+
					'</div>'
				);
				div
				.appendTo(self.divId)
				.show()
				.mouseover( function() {
					guiMessage('show',entity);
				})
				.mouseout( function() {
					guiMessage('hide');
				});
				div.entityId = entity.id;
				div.entityLastHealth = entity.health;
				self.slotList.push(div);
			}
		});

		// Update all slots.
		this.slotList.forEach( slot => {
			let entity = f.getId( slot.entityId );
			let hurt = (entity.health / entity.healthMax) < 0.25;
			let colorNormal = '#454';
			let colorHurt = '#c54';
			let colorPoison = '#a6a939';
			let color = entity.hasDeed(deed=>deed.damageType==DamageType.POISON) ? colorPoison : ( hurt ? colorHurt : colorNormal );
			showHealthBar( slot, entity.health, slot.entityLastHealth, entity.healthMax, entity.name, color );
			slot.entityLastHealth = entity.health;
		});
	}
}

return {
	ViewStatus: ViewStatus
}

});