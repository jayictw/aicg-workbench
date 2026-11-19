'use strict';
class AppRunCollaboration{constructor(){this.stopped=false;}stop(){this.stopped=true;}resume(){this.stopped=false;}allowsAutomatic(){return !this.stopped;}}
module.exports={AppRunCollaboration};
