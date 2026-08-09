// ============================================================
// FIX #4: Rating — Service methods to add to UsersService
// ============================================================
// Add these methods to your existing UsersService class.
// Requires a `user_ratings` table:
//
// CREATE TABLE user_ratings (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
//   created_at TIMESTAMP DEFAULT NOW(),
//   UNIQUE(rater_id, rated_user_id)
// );
// ============================================================

/*
  // Add to UsersController:

  @Post(':id/rate')
  @UseGuards(AuthGuard('jwt'))
  async rateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rating') rating: number,
    @Request() req,
  ) {
    if (req.user.id === id) {
      throw new BadRequestException('You cannot rate yourself');
    }
    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }
    return this.usersService.rateUser(req.user.id, id, rating);
  }


  // Add to UsersService:

  async rateUser(raterId: string, ratedUserId: string, rating: number) {
    // Check if already rated (upsert)
    const existing = await this.userRatingsRepository.findOne({
      where: { rater_id: raterId, rated_user_id: ratedUserId },
    });

    if (existing) {
      existing.rating = rating;
      await this.userRatingsRepository.save(existing);
    } else {
      await this.userRatingsRepository.save({
        rater_id: raterId,
        rated_user_id: ratedUserId,
        rating,
      });
    }

    // Recalculate average rating
    const result = await this.userRatingsRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.rated_user_id = :id', { id: ratedUserId })
      .getRawOne();

    const avgRating = parseFloat(result.avg) || 0;
    const ratingCount = parseInt(result.count) || 0;

    await this.usersRepository.update(ratedUserId, {
      average_rating: Math.round(avgRating * 10) / 10,
      rating_count: ratingCount,
    });

    return { message: 'Rating submitted successfully', average_rating: avgRating, rating_count: ratingCount };
  }
*/

export {}; // Make this a module
